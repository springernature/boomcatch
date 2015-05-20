// Copyright © 2014, 2015 Nature Publishing Group
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

var assert, modulePath;

assert = require('chai').assert;

modulePath = '../../src/mappers/statsd-npg';

suite('mappers/statsd-npg:', function () {
    var log;

    setup(function () {
        log = {};
    });

    teardown(function () {
        log = undefined;
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
        var statsd;

        setup(function () {
            statsd = require(modulePath);
        });

        teardown(function () {
            statsd = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(statsd.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                statsd.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                statsd.initialise({});
            });
        });

        suite('call initialise with default options:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({});
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            test('mapper throws without data', function () {
                assert.throws(function () {
                    mapper(null, 'http://www.nature.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:32.0) Gecko/20100101 Firefox/32.0');
                });
            });

            test('mapper does not throw with empty data', function () {
                assert.doesNotThrow(function () {
                    mapper({}, 'http://www.nature.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:32.0) Gecko/20100101 Firefox/32.0');
                });
            });

            test('mapper throws with bad referer', function () {
                assert.throws(function () {
                    mapper({}, {}, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:32.0) Gecko/20100101 Firefox/32.0');
                });
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        {
                            'rt.tstart': '1',
                            t_resp: '2',
                            t_page: '3',
                            t_done: '4',
                            nt_nav_type: 'bar',
                            nt_nav_st: '5',
                            nt_fet_st: '6',
                            nt_ssl_st: '7',
                            nt_req_st: '8',
                            nt_domint: '9',
                            nt_unload_st: '10',
                            nt_unload_end: '20',
                            nt_red_st: '11',
                            nt_red_end: '22',
                            nt_dns_st: '12',
                            nt_dns_end: '24',
                            nt_con_st: '13',
                            nt_con_end: '26',
                            nt_res_st: '14',
                            nt_res_end: '28',
                            nt_domloading: '15',
                            nt_domcomp: '30',
                            nt_domcontloaded_st: '16',
                            nt_domcontloaded_end: '32',
                            nt_load_st: '17',
                            nt_load_end: '34',
                            restiming: {
                                0: {
                                    rt_st: '18',
                                    rt_fet_st: '19',
                                    rt_scon_st: '20',
                                    rt_req_st: '21',
                                    rt_red_st: '22',
                                    rt_red_end: '44',
                                    rt_dns_st: '23',
                                    rt_dns_end: '46',
                                    rt_con_st: '24',
                                    rt_con_end: '48',
                                    rt_res_st: '25',
                                    rt_res_end: '50',
                                    rt_name: 'http://www.example.com/baz',
                                    rt_in_type: 'css'
                                },
                                1: {
                                    rt_st: '26',
                                    rt_fet_st: '27',
                                    rt_scon_st: '28',
                                    rt_req_st: '29',
                                    rt_red_st: '30',
                                    rt_red_end: '60',
                                    rt_dns_st: '31',
                                    rt_dns_end: '62',
                                    rt_con_st: '32',
                                    rt_con_end: '64',
                                    rt_res_st: '33',
                                    rt_res_end: '66',
                                    rt_name: 'http://www.example.com/qux',
                                    rt_in_type: 'img'
                                }
                            }
                        },
                        'http://www.nature.com',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:32.0) Gecko/20100101 Firefox/32.0'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'live.homepage.rt.firstbyte.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:2|ms',
                        'live.homepage.rt.lastbyte.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:5|ms',
                        'live.homepage.rt.load.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:4|ms',
                        'live.homepage.navtiming.dns.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:19|ms',
                        'live.homepage.navtiming.firstbyte.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:9|ms',
                        'live.homepage.navtiming.domload.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:11|ms',
                        'live.homepage.navtiming.load.gecko.firefox.32_0.desktop.unknown.mac_os.10_8:12|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with alternative data:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        { t_done: '10' },
                        'http://staging-www.nature.com/HortRes?foo=bar',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'staging.hortres.rt.load.webkit.chrome.37_0_2062_124.desktop.unknown.mac_os.10_8_5:10|ms\n');
                });
            });

            // TODO: Reinstate this test when normalisation has been removed, issue #55.
            /*suite('call mapper with zero value:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        { t_done: '0' },
                        'http://staging-www.nature.com/hortres?foo=bar',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, '');
                });
            });*/

            suite('call mapper with no data:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        {},
                        'http://www.nature.com',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:32.0) Gecko/20100101 Firefox/32.0'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, '');
                });
            });
        });

        suite('call initialise with prefix:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({
                    prefix: 'foo.'
                });
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        { t_done: '1' },
                        'http://test-www.nature.com/mtm/',
                        'Mozilla/5.0 (iPod touch; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'foo.test.mtm.rt.load.webkit.mobile_safari.7_0.mobile.apple.ios.7_1_2:1|ms\n');
                });
            });
        });

        suite('call initialise with unterminated prefix:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({
                    prefix: 'bar'
                });
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        { t_done: '2' },
                        'http://nature.local/',
                        'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'bar.development.homepage.rt.load.trident.ie.11_0.desktop.unknown.windows.8_1:2|ms\n');
                });
            });
        });
    });
});

