#!/bin/bash
set -e

PORT=9876
BOOMCATCH_PID=""

cleanup() {
    if [ -n "$BOOMCATCH_PID" ]; then
        kill "$BOOMCATCH_PID" 2>/dev/null || true
        wait "$BOOMCATCH_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "=== Boomcatch Beacon Decoding Test ==="
echo ""

OUTPUT_DIR=$(mktemp -d)
echo "Temp directory: $OUTPUT_DIR"

# Start boomcatch with unmapped mapper and console forwarder
# --workers 0 to run in single-process mode (no clustering)
node src/cli.js \
    --host 127.0.0.1 \
    --port $PORT \
    --mapper unmapped \
    --forwarder console \
    --validator permissive \
    --filter unfiltered \
    --workers 0 \
    --silent \
    > "$OUTPUT_DIR/boomcatch_output.log" 2>&1 &
BOOMCATCH_PID=$!

# Wait for the server to be ready
echo "Waiting for boomcatch to start on port $PORT..."
for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "" "http://127.0.0.1:$PORT/beacon?rt.tstart=1&t_done=1" 2>/dev/null; then
        echo "boomcatch is ready."
        sleep 0.5
        # Clear any startup output
        > "$OUTPUT_DIR/boomcatch_output.log"
        break
    fi
    sleep 0.5
done

PASS=0
FAIL=0

run_test() {
    local test_name="$1"
    local curl_cmd="$2"
    local expected_fields="$3"

    echo ""
    echo "--- Test: $test_name ---"

    # Clear log
    > "$OUTPUT_DIR/boomcatch_output.log"

    # Run the curl command
    eval "$curl_cmd"

    # Give boomcatch a moment to process and write output
    sleep 1

    local output
    output=$(cat "$OUTPUT_DIR/boomcatch_output.log")

    echo "  Output: $output"

    # Check each expected field
    local all_ok=true
    IFS=',' read -ra FIELDS <<< "$expected_fields"
    for field in "${FIELDS[@]}"; do
        field=$(echo "$field" | xargs)  # trim whitespace
        if echo "$output" | grep -q "$field"; then
            echo "  ✓ Found: $field"
        else
            echo "  ✗ Missing: $field"
            all_ok=false
        fi
    done

    if $all_ok; then
        echo "  PASS"
        PASS=$((PASS + 1))
    else
        echo "  FAIL"
        FAIL=$((FAIL + 1))
    fi
}

# ===========================================================================
# Test 1: Simple round-trip timing data via GET
# ===========================================================================
run_test "Simple RT data (GET)" \
    "curl -s -o /dev/null 'http://127.0.0.1:$PORT/beacon?rt.tstart=1000&t_resp=200&t_done=500'" \
    "t_resp,t_done"

# ===========================================================================
# Test 2: Navigation Timing data via GET
# ===========================================================================
run_test "Navigation Timing data (GET)" \
    "curl -s -o /dev/null 'http://127.0.0.1:$PORT/beacon?rt.tstart=1000&t_done=500&nt_nav_st=100&nt_red_st=110&nt_red_end=120&nt_fet_st=130&nt_dns_st=140&nt_dns_end=150&nt_con_st=160&nt_con_end=170&nt_req_st=180&nt_res_st=190&nt_res_end=200&nt_domloading=210&nt_domint=220&nt_domcontloaded_st=230&nt_domcontloaded_end=240&nt_domcomp=250&nt_load_st=260&nt_load_end=270'" \
    "nt_nav_st,nt_dns_st,nt_dns_end,nt_req_st,nt_res_st,nt_res_end,nt_load_st,nt_load_end,nt_domcomp"

# ===========================================================================
# Test 3: Resource Timing data via GET (compressed restiming format)
# This is the format boomerang actually sends - a compressed JSON structure
# ===========================================================================
RESTIMING_DATA=$(python3 -c "import urllib.parse; print(urllib.parse.quote('{\"http://example.com/\":{\"r\":[{\"rt_st\":100,\"rt_dur\":200,\"rt_fet_st\":110,\"rt_dns_st\":120,\"rt_dns_end\":130,\"rt_con_st\":140,\"rt_con_end\":150,\"rt_req_st\":160,\"rt_res_st\":170,\"rt_res_end\":180,\"rt_name\":\"http://example.com/image.png\",\"rt_in_type\":\"img\"}]}}'))")

run_test "Resource Timing data (GET)" \
    "curl -s -o /dev/null 'http://127.0.0.1:$PORT/beacon?rt.tstart=1000&t_done=500&restiming=$RESTIMING_DATA'" \
    "restiming,rt_name"

# ===========================================================================
# Test 4: POST with application/x-www-form-urlencoded (standard boomerang POST)
# ===========================================================================
run_test "RT + NavTiming data (POST urlencoded)" \
    "curl -s -o /dev/null -X POST -H 'Content-Type: application/x-www-form-urlencoded' -d 'rt.tstart=1000&t_resp=200&t_done=500&nt_nav_st=100&nt_dns_st=140&nt_dns_end=150&nt_req_st=180&nt_res_st=190&nt_res_end=200&nt_load_st=260&nt_load_end=270' 'http://127.0.0.1:$PORT/beacon'" \
    "t_resp,t_done,nt_nav_st,nt_dns_st,nt_req_st,nt_load_end"

# ===========================================================================
# Test 5: POST with text/plain content type (boomerang also supports this)
# ===========================================================================
# NOTE: boomerang sends text/plain as JSON, not as URL-encoded form data
# This test sends valid JSON to match what boomerang actually does
run_test "RT data (POST text/plain as JSON)" \
    "curl -s -o /dev/null -X POST -H 'Content-Type: text/plain' -d '{\"rt.tstart\":\"1000\",\"t_resp\":\"200\",\"t_done\":\"500\"}' 'http://127.0.0.1:$PORT/beacon'" \
    "t_resp,t_done"

# ===========================================================================
# Test 5b: POST with text/plain but URL-encoded body (this SHOULD fail)
# Boomerang should not send URL-encoded data with text/plain, but if it
# does, boomcatch will try JSON.parse and fail with a 400 error
# ===========================================================================
echo ""
echo "--- Test: text/plain with URL-encoded body (expected 400) ---"
> "$OUTPUT_DIR/boomcatch_output.log"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H 'Content-Type: text/plain' -d 'rt.tstart=1000&t_resp=200&t_done=500' "http://127.0.0.1:$PORT/beacon")
sleep 0.5
if [ "$HTTP_CODE" = "400" ]; then
    echo "  ✓ Server correctly returns 400 for non-JSON text/plain body"
    echo "  PASS"
    PASS=$((PASS + 1))
else
    echo "  ✗ Expected 400, got $HTTP_CODE"
    echo "  FAIL"
    FAIL=$((FAIL + 1))
fi

# ===========================================================================
# Test 6: Combined RT + NavTiming + ResourceTiming in a single beacon (GET)
# This is the scenario users report problems with
# ===========================================================================
COMBINED_RESTIMING=$(python3 -c "import urllib.parse; print(urllib.parse.quote('{\"http://example.com/\":{\"r\":[{\"rt_st\":100,\"rt_dur\":200,\"rt_name\":\"http://example.com/style.css\",\"rt_in_type\":\"css\"},{\"rt_st\":150,\"rt_dur\":300,\"rt_name\":\"http://example.com/app.js\",\"rt_in_type\":\"script\"}]}}'))")

run_test "Combined RT + NavTiming + ResTiming (GET)" \
    "curl -s -o /dev/null 'http://127.0.0.1:$PORT/beacon?rt.tstart=1000&t_resp=200&t_done=500&t_other=boomerang|10,boomr_fb|5&nt_nav_st=100&nt_red_st=0&nt_red_end=0&nt_fet_st=105&nt_dns_st=110&nt_dns_end=120&nt_con_st=120&nt_con_end=130&nt_req_st=130&nt_res_st=140&nt_res_end=200&nt_domloading=210&nt_domint=250&nt_domcontloaded_st=260&nt_domcontloaded_end=265&nt_domcomp=300&nt_load_st=300&nt_load_end=310&restiming=$COMBINED_RESTIMING'" \
    "t_resp,t_done,t_other,nt_nav_st,nt_dns_st,nt_load_end,restiming"

# ===========================================================================
# Test 7: Combined data via POST (the most realistic scenario)
# ===========================================================================
COMBINED_POST_RESTIMING=$(python3 -c "import urllib.parse; print(urllib.parse.quote('{\"http://example.com/\":{\"r\":[{\"rt_st\":100,\"rt_dur\":200,\"rt_name\":\"http://example.com/style.css\",\"rt_in_type\":\"css\"}]}}'))")
COMBINED_POST_BODY="rt.tstart=1000&t_resp=200&t_done=500&t_other=boomerang%7C10%2Cboomr_fb%7C5&nt_nav_st=100&nt_fet_st=105&nt_dns_st=110&nt_dns_end=120&nt_con_st=120&nt_con_end=130&nt_req_st=130&nt_res_st=140&nt_res_end=200&nt_domloading=210&nt_domint=250&nt_domcontloaded_st=260&nt_domcontloaded_end=265&nt_domcomp=300&nt_load_st=300&nt_load_end=310&restiming=$COMBINED_POST_RESTIMING"

run_test "Combined RT + NavTiming + ResTiming (POST)" \
    "curl -s -o /dev/null -X POST -H 'Content-Type: application/x-www-form-urlencoded' -d '$COMBINED_POST_BODY' 'http://127.0.0.1:$PORT/beacon'" \
    "t_resp,t_done,t_other,nt_nav_st,nt_dns_st,nt_load_end,restiming"

# ===========================================================================
# Test 8: Deeply nested restiming with array notation (boomerang uses this)
# ===========================================================================
run_test "Array-style restiming params (POST)" \
    "curl -s -o /dev/null -X POST -H 'Content-Type: application/x-www-form-urlencoded' -d 'rt.tstart=1000&t_done=500&restiming[0][rt_st]=100&restiming[0][rt_dur]=200&restiming[0][rt_name]=http://example.com/a.js&restiming[0][rt_in_type]=script&restiming[1][rt_st]=150&restiming[1][rt_dur]=300&restiming[1][rt_name]=http://example.com/b.css&restiming[1][rt_in_type]=css' 'http://127.0.0.1:$PORT/beacon'" \
    "t_done,restiming"

# ===========================================================================
# Test 8b: Restiming URLs with ampersands (GitHub issue #83)
# URLs containing query strings with & get mangled when decodeURIComponent
# is applied before qs.parse, because the decoded & becomes a param delimiter
# ===========================================================================
RESTIMING_WITH_AMPS="rt.tstart=1000&t_done=500&restiming=%7B%22use.typekit.net%2Faf%2F4713c5%2F000000000000000000017690%2F27%2Fl%3Fprimer%3D09b6306563171828e867a80b0e487a34c56b49b8efde4541b63ffd44535e9a56%26fvd%3Dn4%26v%3D3%22%3A%223p%2C2g%2C28%2C13%2C13%2Cb%2Ca%2Ca%2C2111fw%2C8720%22%7D"

run_test "Restiming URLs with ampersands (POST, issue #83)" \
    "curl -s -o /dev/null -X POST -H 'Content-Type: application/x-www-form-urlencoded' -d '$RESTIMING_WITH_AMPS' 'http://127.0.0.1:$PORT/beacon'" \
    "t_done,restiming,typekit.net,fvd"

# ===========================================================================
# Test 9: Realistic boomerang beacon captured from a real page load
# ===========================================================================
run_test "Realistic full beacon (GET)" \
    "curl -s -o /dev/null 'http://127.0.0.1:$PORT/beacon?rt.start=navigation&rt.tstart=1422000000000&rt.bstart=1422000000100&rt.end=1422000003000&t_resp=500&t_page=2500&t_done=3000&r=http%3A%2F%2Fexample.com%2Fpage&u=http%3A%2F%2Fexample.com%2Fpage&v=0.9&nt_nav_type=0&nt_nav_st=1422000000000&nt_red_cnt=0&nt_red_st=0&nt_red_end=0&nt_fet_st=1422000000010&nt_dns_st=1422000000020&nt_dns_end=1422000000050&nt_con_st=1422000000050&nt_con_end=1422000000100&nt_req_st=1422000000100&nt_res_st=1422000000300&nt_res_end=1422000000500&nt_domloading=1422000000600&nt_domint=1422000001500&nt_domcontloaded_st=1422000001500&nt_domcontloaded_end=1422000001600&nt_domcomp=1422000002800&nt_load_st=1422000002800&nt_load_end=1422000003000'" \
    "navigation,t_resp,t_page,t_done,nt_nav_type,nt_nav_st,nt_dns_st,nt_dns_end,nt_req_st,nt_res_st,nt_res_end,nt_domloading,nt_load_end"

# ===========================================================================
# Test 10: GET vs POST dot-notation parsing consistency
# Boomerang sends rt.tstart, rt.bstart, rt.end etc. with dot notation.
# GET parses these with allowDots:true (nested), but POST does not.
# This test checks if POST produces the same nested structure as GET.
# ===========================================================================
echo ""
echo "--- Test: GET vs POST dot-notation consistency ---"

> "$OUTPUT_DIR/boomcatch_output.log"
curl -s -o /dev/null "http://127.0.0.1:$PORT/beacon?rt.tstart=1000&rt.end=2000&t_done=500"
sleep 1
GET_OUTPUT=$(cat "$OUTPUT_DIR/boomcatch_output.log")
echo "  GET output:  $GET_OUTPUT"

> "$OUTPUT_DIR/boomcatch_output.log"
curl -s -o /dev/null -X POST -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'rt.tstart=1000&rt.end=2000&t_done=500' "http://127.0.0.1:$PORT/beacon"
sleep 1
POST_OUTPUT=$(cat "$OUTPUT_DIR/boomcatch_output.log")
echo "  POST output: $POST_OUTPUT"

# Check if GET produces nested rt object
if echo "$GET_OUTPUT" | grep -q '"rt":{'; then
    echo "  ✓ GET correctly nests rt.* into rt:{} object"
else
    echo "  ✗ GET did NOT nest rt.* fields"
fi

# Check if POST also produces nested rt object (it should, but doesn't)
if echo "$POST_OUTPUT" | grep -q '"rt":{'; then
    echo "  ✓ POST correctly nests rt.* into rt:{} object"
    echo "  PASS"
    PASS=$((PASS + 1))
else
    echo "  ✗ POST does NOT nest rt.* fields — BUG: qs.parse missing allowDots option"
    echo "  FAIL"
    FAIL=$((FAIL + 1))
fi

# ===========================================================================
# Summary
# ===========================================================================
echo ""
echo "=== Summary ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Total:  $((PASS + FAIL))"

# Cleanup
rm -rf "$OUTPUT_DIR"

if [ $FAIL -gt 0 ]; then
    exit 1
fi
exit 0
