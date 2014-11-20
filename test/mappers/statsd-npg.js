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

var assert, spooks, modulePath;

assert = require('chai').assert;
spooks = require('spooks');

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
                            rt: {
                                timestamps: {
                                    start: 1
                                },
                                events: {},
                                durations: {
                                    firstbyte: 2,
                                    lastbyte: 3,
                                    load: 4
                                },
                                r: 'http://www.example.com/foo'
                            },
                            navtiming: {
                                timestamps: {
                                    start: 5,
                                    fetchStart: 6,
                                    sslStart: 7,
                                    requestStart: 8,
                                    domInteractive: 9
                                },
                                events: {
                                    unload: { start: 10, end: 20 },
                                    redirect: { start: 11, end: 22 },
                                    dns: { start: 12, end: 24 },
                                    connect: { start: 13, end: 26 },
                                    response: { start: 14, end: 28 },
                                    dom: { start: 15, end: 30 },
                                    domContent: { start: 16, end: 32 },
                                    load: { start: 17, end: 34 }
                                },
                                durations: {},
                                type: 'bar'
                            },
                            restiming: [
                                {
                                    timestamps: {
                                        start: 18,
                                        fetchStart: 19,
                                        sslStart: 20,
                                        requestStart: 21
                                    },
                                    events: {
                                        redirect: { start: 22, end: 44 },
                                        dns: { start: 23, end: 46 },
                                        connect: { start: 24, end: 48 },
                                        response: { start: 25, end: 50 }
                                    },
                                    durations: {},
                                    name: 'http://www.example.com/baz',
                                    type: 'css'
                                },
                                {
                                    timestamps: {
                                        start: 26,
                                        fetchStart: 27,
                                        sslStart: 28,
                                        requestStart: 29
                                    },
                                    events: {
                                        redirect: { start: 30, end: 60 },
                                        dns: { start: 31, end: 62 },
                                        connect: { start: 32, end: 64 },
                                        response: { start: 33, end: 66 }
                                    },
                                    durations: {},
                                    name: 'http://www.example.com/qux',
                                    type: 'img'
                                }
                            ]
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
                        'live.homepage.rt.firstbyte.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:2|ms',
                        'live.homepage.rt.lastbyte.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:3|ms',
                        'live.homepage.rt.load.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:4|ms',
                        'live.homepage.navtiming.dns.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:19|ms',
                        'live.homepage.navtiming.firstbyte.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:9|ms',
                        'live.homepage.navtiming.domload.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:11|ms',
                        'live.homepage.navtiming.load.gecko.32_0.firefox.32_0.desktop.unknown.mac_os.10_8:12|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with alternative data:', function () {
                var result;

                setup(function () {
                    result = mapper(
                        {
                            rt: {
                                timestamps: {},
                                events: {},
                                durations: {
                                    load: 10
                                }
                            }
                        },
                        'http://staging-www.nature.com/hortres?foo=bar',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'staging.hortres.rt.load.webkit.537_36.chrome.37_0_2062_124.desktop.unknown.mac_os.10_8_5:10|ms\n');
                });
            });

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
                        {
                            rt: {
                                timestamps: {},
                                events: {},
                                durations: {
                                    load: 1
                                }
                            }
                        },
                        'http://test-www.nature.com/mtm/',
                        'Mozilla/5.0 (iPod touch; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'foo.test.mtm.rt.load.webkit.537_51_2.mobile_safari.7_0.mobile.apple.ios.7_1_2:1|ms\n');
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
                        {
                            rt: {
                                timestamps: {},
                                events: {},
                                durations: {
                                load: 2
                                }
                            }
                        },
                        'http://nature.local/',
                        'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko'
                    );
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'bar.development.homepage.rt.load.trident.7_0.ie.11_0.desktop.unknown.windows.8_1:2|ms\n');
                });
            });
        });
    });
});

