// Copyright © 2014 Nature Publishing Group
//
// This file is part of boomcatch.
//
// Boomcatch is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Boomcatch is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with boomcatch. If not, see <http://www.gnu.org/licenses/>.

'use strict';

var mockery, assert, spooks, modulePath;

mockery = require('mockery');
assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/mappers/har';

mockery.registerAllowable(modulePath);
mockery.registerAllowable('../../package.json');
mockery.registerAllowable('../normalise');
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('querystring');

suite('mappers/har:', function () {
    var log, useragent, browser;

    setup(function () {
        log = {};
        useragent = spooks.fn({
            name: 'useragent',
            log: log
        });
        useragent.lookup = spooks.fn({
            name: 'lookup',
            log: log,
            results: [
                {
                    toJSON: function () {
                        log.counts.toJSON += 1;
                        log.these.toJSON.push(this);
                        log.args.toJSON.push(arguments);
                        return browser;
                    }
                }
            ]
        });
        log.counts.toJSON = 0;
        log.these.toJSON = [];
        log.args.toJSON = [];
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('useragent', useragent);
    });

    teardown(function () {
        mockery.deregisterMock('useragent');
        mockery.disable();
        log = useragent = undefined;
    });

    test('require does not throw', function () {
        assert.doesNotThrow(function () {
            require(modulePath);
        });
    });

    test('require returns object', function () {
        assert.isObject(require(modulePath));
    });

    suite('require:', function () {
        var har;

        setup(function () {
            har = require(modulePath);
        });

        teardown(function () {
            har = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(har.initialise);
        });

        test('initialise does not throw without options', function () {
            assert.doesNotThrow(function () {
                har.initialise();
            });
        });

        test('useragent was not called', function () {
            assert.strictEqual(log.counts.useragent, 0);
        });

        suite('call initialise without options:', function () {
            var mapper;

            setup(function () {
                mapper = har.initialise();
            });

            teardown(function () {
                mapper = undefined;
            });

            test('useragent was called once', function () {
                assert.strictEqual(log.counts.useragent, 1);
            });

            test('useragent was called correctly', function () {
                assert.isUndefined(log.these.useragent[0]);
                assert.lengthOf(log.args.useragent[0], 1);
                assert.isTrue(log.args.useragent[0][0]);
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            test('mapper throws without data', function () {
                assert.throws(function () {
                    mapper(undefined, 'foo', 'bar');
                });
            });

            test('mapper does not throw with empty data', function () {
                assert.doesNotThrow(function () {
                    mapper({}, 'foo', 'bar');
                });
            });

            suite('call mapper without restiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        nt_nav_type: '0',
                        nt_nav_st: '1',
                        nt_fet_st: '2',
                        nt_ssl_st: '3',
                        nt_req_st: '4',
                        nt_domint: '5',
                        nt_unload_st: '6',
                        nt_unload_end: '7',
                        nt_red_st: '8',
                        nt_red_end: '9',
                        nt_dns_st: '10',
                        nt_dns_end: '11',
                        nt_con_st: '12',
                        nt_con_end: '13',
                        nt_res_st: '14',
                        nt_res_end: '15',
                        nt_domloading: '16',
                        nt_domcomp: '17',
                        nt_domcontloaded_st: '18',
                        nt_domcontloaded_end: '19',
                        nt_load_st: '20',
                        nt_load_end: '21'
                    }, 'foo', 'bar');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was empty string', function () {
                    assert.strictEqual(result, '');
                });

                test('useragent.lookup was not called', function () {
                    assert.strictEqual(log.counts.lookup, 0);
                });

                test('useragent.toJSON was not called', function () {
                    assert.strictEqual(log.counts.toJSON, 0);
                });
            });

            suite('call mapper without navtiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        restiming: {
                            0: {
                                rt_name: 'http://www.example.com/foo?bar=baz#qux',
                                rt_in_type: 'css',
                                rt_st: '1',
                                rt_fet_st: '2',
                                rt_scon_st: '3',
                                rt_req_st: '4',
                                rt_red_st: '5',
                                rt_red_end: '6',
                                rt_dns_st: '7',
                                rt_dns_end: '8',
                                rt_con_st: '10',
                                rt_con_end: '11',
                                rt_res_st: '12',
                                rt_res_end: '13'
                            },
                            1: {
                                rt_name: 'https://nature.com/wibble?k=v&l=w',
                                rt_in_type: 'img',
                                rt_st: '14',
                                rt_fet_st: '15',
                                rt_scon_st: '16',
                                rt_req_st: '17',
                                rt_red_st: '18',
                                rt_red_end: '19',
                                rt_dns_st: '20',
                                rt_dns_end: '21',
                                rt_con_st: '22',
                                rt_con_end: '23',
                                rt_res_st: '24',
                                rt_res_end: '25'
                            }
                        }
                    }, 'foo', 'bar');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was empty string', function () {
                    assert.strictEqual(result, '');
                });

                test('useragent.lookup was not called', function () {
                    assert.strictEqual(log.counts.lookup, 0);
                });

                test('useragent.toJSON was not called', function () {
                    assert.strictEqual(log.counts.toJSON, 0);
                });
            });

            suite('call mapper with valid data:', function () {
                var result;

                setup(function () {
                    browser = {
                        family: 'foo',
                        major: 'bar'
                    };
                    result = mapper({
                        nt_nav_type: '0',
                        nt_nav_st: '1',
                        nt_fet_st: '2',
                        nt_ssl_st: '3',
                        nt_req_st: '4',
                        nt_domint: '5',
                        nt_unload_st: '6',
                        nt_unload_end: '12',
                        nt_red_st: '7',
                        nt_red_end: '14',
                        nt_dns_st: '8',
                        nt_dns_end: '16',
                        nt_con_st: '9',
                        nt_con_end: '18',
                        nt_res_st: '10',
                        nt_res_end: '20',
                        nt_domloading: '11',
                        nt_domcomp: '22',
                        nt_domcontloaded_st: '12',
                        nt_domcontloaded_end: '24',
                        nt_load_st: '13',
                        nt_load_end: '26',
                        restiming: {
                            0: {
                                rt_name: 'http://www.example.com/foo?bar=baz#qux',
                                rt_in_type: 'img',
                                rt_st: '14',
                                rt_fet_st: '15',
                                rt_scon_st: '16',
                                rt_req_st: '17',
                                rt_red_st: '18',
                                rt_red_end: '36',
                                rt_dns_st: '19',
                                rt_dns_end: '38',
                                rt_con_st: '20',
                                rt_con_end: '40',
                                rt_res_st: '21',
                                rt_res_end: '42'
                            },
                            1: {
                                rt_name: 'https://nature.com/wibble?k=v&l=w',
                                rt_in_type: 'css',
                                rt_st: '220',
                                rt_fet_st: '230',
                                rt_scon_st: '240',
                                rt_req_st: '250',
                                rt_red_st: '280',
                                rt_red_end: '560',
                                rt_dns_st: '290',
                                rt_dns_end: '580',
                                rt_con_st: '300',
                                rt_con_end: '600',
                                rt_res_st: '310',
                                rt_res_end: '620'
                            }
                        }
                    }, 'baz', 'qux');
                });

                teardown(function () {
                    browser = result = undefined;
                });

                test('useragent.lookup was called once', function () {
                    assert.strictEqual(log.counts.lookup, 1);
                });

                test('useragent.lookup was called correctly', function () {
                    assert.strictEqual(log.these.lookup[0], useragent);
                    assert.lengthOf(log.args.lookup[0], 1);
                    assert.strictEqual(log.args.lookup[0][0], 'qux');
                });

                test('useragent.toJSON was called once', function () {
                    assert.strictEqual(log.counts.toJSON, 1);
                });

                test('useragent.toJSON was called correctly', function () {
                    assert.strictEqual(log.these.toJSON[0], useragent.lookup());
                    assert.lengthOf(log.args.toJSON[0], 0);
                });

                test('result was not empty string', function () {
                    assert.notEqual(result, '');
                });

                test('result was valid JSON', function () {
                    assert.doesNotThrow(function () {
                        JSON.parse(result);
                    });
                });

                suite('parse result:', function () {
                    var data;

                    setup(function () {
                        data = JSON.parse(result);
                    });

                    teardown(function () {
                        data = undefined;
                    });

                    test('data is object', function () {
                        assert.isObject(data);
                        assert.lengthOf(Object.keys(data), 1);
                    });

                    test('data.log is object', function () {
                        assert.isObject(data.log);
                        assert.lengthOf(Object.keys(data.log), 5);
                    });

                    test('data.log.version is correct', function () {
                        assert.strictEqual(data.log.version, '1.2');
                    });

                    test('data.log.creator is object', function () {
                        assert.isObject(data.log.creator);
                        assert.lengthOf(Object.keys(data.log.creator), 2);
                    });

                    test('data.log.creator is correct', function () {
                        assert.strictEqual(data.log.creator.name, 'boomcatch');
                        assert.strictEqual(data.log.creator.version, require('../../package.json').version);
                    });

                    test('data.log.browser is object', function () {
                        assert.isObject(data.log.browser);
                        assert.lengthOf(Object.keys(data.log.browser), 2);
                    });

                    test('data.log.browser is correct', function () {
                        assert.strictEqual(data.log.browser.name, 'foo');
                        assert.strictEqual(data.log.browser.version, 'bar');
                    });

                    test('data.log.pages is array', function () {
                        assert.isArray(data.log.pages);
                        assert.lengthOf(data.log.pages, 1);
                    });

                    test('data.log.pages[0] is object', function () {
                        assert.isObject(data.log.pages[0]);
                        assert.lengthOf(Object.keys(data.log.pages[0]), 4);
                    });

                    test('data.log.pages[0] is correct', function () {
                        assert.strictEqual(data.log.pages[0].startedDateTime, '1970-01-01T00:00:00.001Z');
                        assert.strictEqual(data.log.pages[0].id, '0');
                        assert.strictEqual(data.log.pages[0].title, 'baz');
                        assert.isObject(data.log.pages[0].pageTimings);
                        assert.lengthOf(Object.keys(data.log.pages[0].pageTimings), 2);
                        assert.strictEqual(data.log.pages[0].pageTimings.onContentLoad, 12);
                        assert.strictEqual(data.log.pages[0].pageTimings.onLoad, 13);
                    });

                    test('data.log.entries is array', function () {
                        assert.isArray(data.log.entries);
                        assert.lengthOf(data.log.entries, 2);
                    });

                    test('data.log.entries[0] is object', function () {
                        assert.isObject(data.log.entries[0]);
                        assert.lengthOf(Object.keys(data.log.entries[0]), 7);
                    });

                    test('data.log.entries[0] is correct', function () {
                        assert.strictEqual(data.log.entries[0].pageref, '0');
                        assert.strictEqual(data.log.entries[0].startedDateTime, '1970-01-01T00:00:00.014Z');
                        assert.strictEqual(data.log.entries[0].time, 65);

                        assert.isObject(data.log.entries[0].request);
                        assert.lengthOf(Object.keys(data.log.entries[0].request), 8);

                        assert.isObject(data.log.entries[0].response);
                        assert.lengthOf(Object.keys(data.log.entries[0].response), 9);

                        assert.isObject(data.log.entries[0].cache);
                        assert.lengthOf(Object.keys(data.log.entries[0].cache), 0);

                        assert.isObject(data.log.entries[0].timings);
                        assert.lengthOf(Object.keys(data.log.entries[0].timings), 7);
                    });

                    test('data.log.entries[0].request is correct', function () {
                        assert.strictEqual(data.log.entries[0].request.method, '');
                        assert.strictEqual(data.log.entries[0].request.url, 'http://www.example.com/foo?bar=baz#qux');
                        assert.strictEqual(data.log.entries[0].request.httpVersion, '');
                        assert.isArray(data.log.entries[0].request.cookies);
                        assert.lengthOf(data.log.entries[0].request.cookies, 0);
                        assert.isArray(data.log.entries[0].request.headers);
                        assert.lengthOf(data.log.entries[0].request.headers, 0);
                        assert.isArray(data.log.entries[0].request.queryString);
                        assert.lengthOf(data.log.entries[0].request.queryString, 1);
                        assert.isObject(data.log.entries[0].request.queryString[0]);
                        assert.lengthOf(Object.keys(data.log.entries[0].request.queryString[0]), 2);
                        assert.strictEqual(data.log.entries[0].request.queryString[0].name, 'bar');
                        assert.strictEqual(data.log.entries[0].request.queryString[0].value, 'baz');
                        assert.strictEqual(data.log.entries[0].request.headerSize, -1);
                        assert.strictEqual(data.log.entries[0].request.bodySize, -1);
                    });

                    test('data.log.entries[0].response is correct', function () {
                        assert.strictEqual(data.log.entries[0].response.status, -1);
                        assert.strictEqual(data.log.entries[0].response.statusText, '');
                        assert.strictEqual(data.log.entries[0].response.httpVersion, '');
                        assert.isArray(data.log.entries[0].response.cookies);
                        assert.lengthOf(data.log.entries[0].response.cookies, 0);
                        assert.isArray(data.log.entries[0].response.headers);
                        assert.lengthOf(data.log.entries[0].response.headers, 0);
                        assert.isObject(data.log.entries[0].response.content);
                        assert.lengthOf(Object.keys(data.log.entries[0].response.content), 2);
                        assert.strictEqual(data.log.entries[0].response.content.size, -1);
                        assert.strictEqual(data.log.entries[0].response.content.mimeType, '');
                        assert.strictEqual(data.log.entries[0].response.redirectURL, '');
                        assert.strictEqual(data.log.entries[0].response.headerSize, -1);
                        assert.strictEqual(data.log.entries[0].response.bodySize, -1);
                    });

                    test('data.log.entries[0].timings is correct', function () {
                        assert.strictEqual(data.log.entries[0].timings.blocked, 1);
                        assert.strictEqual(data.log.entries[0].timings.dns, 19);
                        assert.strictEqual(data.log.entries[0].timings.connect, 20);
                        assert.strictEqual(data.log.entries[0].timings.send, 4);
                        assert.strictEqual(data.log.entries[0].timings.wait, 0);
                        assert.strictEqual(data.log.entries[0].timings.receive, 21);
                        assert.strictEqual(data.log.entries[0].timings.ssl, 24);
                    });

                    test('data.log.entries[1] is correct', function () {
                        assert.strictEqual(data.log.entries[1].pageref, '0');
                        assert.strictEqual(data.log.entries[1].startedDateTime, '1970-01-01T00:00:00.220Z');
                        assert.strictEqual(data.log.entries[1].time, 970);
                    });

                    test('data.log.entries[1].request is correct', function () {
                        assert.strictEqual(data.log.entries[1].request.url, 'https://nature.com/wibble?k=v&l=w');
                        assert.lengthOf(data.log.entries[1].request.queryString, 2);
                        assert.strictEqual(data.log.entries[1].request.queryString[0].name, 'k');
                        assert.strictEqual(data.log.entries[1].request.queryString[0].value, 'v');
                        assert.strictEqual(data.log.entries[1].request.queryString[1].name, 'l');
                        assert.strictEqual(data.log.entries[1].request.queryString[1].value, 'w');
                    });

                    test('data.log.entries[1].timings is correct', function () {
                        assert.strictEqual(data.log.entries[1].timings.blocked, 10);
                        assert.strictEqual(data.log.entries[1].timings.dns, 290);
                        assert.strictEqual(data.log.entries[1].timings.connect, 300);
                        assert.strictEqual(data.log.entries[1].timings.send, 60);
                        assert.strictEqual(data.log.entries[1].timings.wait, 0);
                        assert.strictEqual(data.log.entries[1].timings.receive, 310);
                        assert.strictEqual(data.log.entries[1].timings.ssl, 360);
                    });
                });
            });

            suite('call mapper with minimal data:', function () {
                var result;

                setup(function () {
                    browser = {
                        family: 'browser name',
                        major: 'browser version'
                    };
                    result = mapper({
                        nt_nav_type: '0',
                        nt_nav_st: '100',
                        nt_fet_st: '200',
                        nt_ssl_st: '300',
                        nt_req_st: '400',
                        nt_domint: '500',
                        nt_unload_st: '600',
                        nt_unload_end: '1200',
                        nt_red_st: '700',
                        nt_red_end: '1400',
                        nt_dns_st: '800',
                        nt_dns_end: '1600',
                        nt_con_st: '900',
                        nt_con_end: '1800',
                        nt_res_st: '1000',
                        nt_res_end: '2000',
                        nt_domloading: '1100',
                        nt_domcomp: '2200',
                        nt_domcontloaded_st: '1200',
                        nt_domcontloaded_end: '2400',
                        nt_load_st: '1300',
                        nt_load_end: '2600',
                        restiming: [
                            {
                                rt_name: 'http://example.com/?a=b&c=d',
                                rt_in_type: 'css',
                                rt_st: '1400',
                                rt_fet_st: '1500'
                            }
                        ]
                    }, 'referer', 'user agent');
                });

                teardown(function () {
                    browser = result = undefined;
                });

                test('useragent.lookup was called correctly', function () {
                    assert.strictEqual(log.args.lookup[0][0], 'user agent');
                });

                test('result was not empty string', function () {
                    assert.notEqual(result, '');
                });

                test('result was valid JSON', function () {
                    assert.doesNotThrow(function () {
                        JSON.parse(result);
                    });
                });

                suite('parse result:', function () {
                    var data;

                    setup(function () {
                        data = JSON.parse(result);
                    });

                    teardown(function () {
                        data = undefined;
                    });

                    test('data.log.browser is correct', function () {
                        assert.strictEqual(data.log.browser.name, 'browser name');
                        assert.strictEqual(data.log.browser.version, 'browser version');
                    });

                    test('data.log.pages[0] is correct', function () {
                        assert.strictEqual(data.log.pages[0].startedDateTime, '1970-01-01T00:00:00.100Z');
                        assert.strictEqual(data.log.pages[0].title, 'referer');
                        assert.strictEqual(data.log.pages[0].pageTimings.onContentLoad, 1200);
                        assert.strictEqual(data.log.pages[0].pageTimings.onLoad, 1300);
                    });

                    test('data.log.entries has one item', function () {
                        assert.lengthOf(data.log.entries, 1);
                    });

                    test('data.log.entries[0] is correct', function () {
                        assert.strictEqual(data.log.entries[0].startedDateTime, '1970-01-01T00:00:01.400Z');
                        assert.strictEqual(data.log.entries[0].time, 100);
                    });

                    test('data.log.entries[0].request is correct', function () {
                        assert.strictEqual(data.log.entries[0].request.url, 'http://example.com/?a=b&c=d');
                        assert.lengthOf(data.log.entries[0].request.queryString, 2);
                        assert.strictEqual(data.log.entries[0].request.queryString[0].name, 'a');
                        assert.strictEqual(data.log.entries[0].request.queryString[0].value, 'b');
                        assert.strictEqual(data.log.entries[0].request.queryString[1].name, 'c');
                        assert.strictEqual(data.log.entries[0].request.queryString[1].value, 'd');
                    });

                    test('data.log.entries[0].timings is correct', function () {
                        assert.strictEqual(data.log.entries[0].timings.blocked, 100);
                        assert.strictEqual(data.log.entries[0].timings.dns, -1);
                        assert.strictEqual(data.log.entries[0].timings.connect, -1);
                        assert.strictEqual(data.log.entries[0].timings.send, -1);
                        assert.strictEqual(data.log.entries[0].timings.wait, 0);
                        assert.strictEqual(data.log.entries[0].timings.receive, -1);
                        assert.strictEqual(data.log.entries[0].timings.ssl, -1);
                    });
                });
            });
        });
    });
});

