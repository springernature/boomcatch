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

modulePath = '../../src/mappers/statsd';

suite('mappers/statsd:', function () {
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
                    mapper();
                });
            });

            test('mapper does not throw with empty data', function () {
                assert.doesNotThrow(function () {
                    mapper({});
                });
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
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
                                start: 4,
                                fetchStart: 5,
                                sslStart: 6,
                                requestStart: 7,
                                domInteractive: 8
                            },
                            events: {
                                unload: { start: 9, end: 10 },
                                redirect: { start: 11, end: 12 },
                                dns: { start: 13, end: 14 },
                                connect: { start: 15, end: 16 },
                                response: { start: 17, end: 18 },
                                dom: { start: 19, end: 20 },
                                domContent: { start: 21, end: 22 },
                                load: { start: 23, end: 24 }
                            },
                            durations: {},
                            type: 'bar'
                        },
                        restiming: [
                            {
                                timestamps: {
                                    start: 34,
                                    fetchStart: 35,
                                    sslStart: 36,
                                    requestStart: 37
                                },
                                events: {
                                    redirect: { start: 38, end: 39 },
                                    dns: { start: 40, end: 41 },
                                    connect: { start: 42, end: 43 },
                                    response: { start: 44, end: 45 }
                                },
                                durations: {},
                                name: 'http://www.example.com/baz',
                                type: 'css'
                            },
                            {
                                timestamps: {
                                    start: 51,
                                    fetchStart: 52,
                                    sslStart: 53,
                                    requestStart: 54
                                },
                                events: {
                                    redirect: { start: 55, end: 56 },
                                    dns: { start: 57, end: 58 },
                                    connect: { start: 59, end: 60 },
                                    response: { start: 61, end: 62 }
                                },
                                durations: {},
                                name: 'http://www.example.com/qux',
                                type: 'img'
                            }
                        ]
                    }, 'wibble');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'rt.start:1|g',
                        'rt.firstbyte:2|ms',
                        'rt.lastbyte:3|ms',
                        'rt.load:4|ms',
                        'navtiming.start:4|g',
                        'navtiming.fetchStart:5|g',
                        'navtiming.sslStart:6|g',
                        'navtiming.requestStart:7|g',
                        'navtiming.domInteractive:8|g',
                        'navtiming.unload.start:9|g',
                        'navtiming.unload.end:10|g',
                        'navtiming.redirect.start:11|g',
                        'navtiming.redirect.end:12|g',
                        'navtiming.dns.start:13|g',
                        'navtiming.dns.end:14|g',
                        'navtiming.connect.start:15|g',
                        'navtiming.connect.end:16|g',
                        'navtiming.response.start:17|g',
                        'navtiming.response.end:18|g',
                        'navtiming.dom.start:19|g',
                        'navtiming.dom.end:20|g',
                        'navtiming.domContent.start:21|g',
                        'navtiming.domContent.end:22|g',
                        'navtiming.load.start:23|g',
                        'navtiming.load.end:24|g',
                        'navtiming.unload:25|ms',
                        'navtiming.redirect:26|ms',
                        'navtiming.dns:27|ms',
                        'navtiming.connect:28|ms',
                        'navtiming.firstbyte:29|ms',
                        'navtiming.lastbyte:30|ms',
                        'navtiming.dom:32|ms',
                        'navtiming.domContent:31|ms',
                        'navtiming.load:33|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.start:34|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.fetchStart:35|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.sslStart:36|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.requestStart:37|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.redirect.start:38|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.redirect.end:39|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.dns.start:40|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.dns.end:41|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.connect.start:42|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.connect.end:43|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.response.start:44|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.response.end:45|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.redirect:46|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.dns:47|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.connect:48|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.firstbyte:49|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.lastbyte:50|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.start:51|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.fetchStart:52|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.sslStart:53|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.requestStart:54|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.redirect.start:55|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.redirect.end:56|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.dns.start:57|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.dns.end:58|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.connect.start:59|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.connect.end:60|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.response.start:61|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.response.end:62|g',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.redirect:63|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.dns:64|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.connect:65|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.firstbyte:66|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.lastbyte:67|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with alternative data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        rt: {
                            timestamps: {},
                            events: {},
                            durations: {
                                load: 10
                            }
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'rt.load:10|ms\n');
                });
            });

            suite('call mapper with no data:', function () {
                var result;

                setup(function () {
                    result = mapper({});
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
                    result = mapper({
                        rt: {
                            timestamps: {},
                            events: {},
                            durations: {
                                load: 1
                            }
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'foo.rt.load:1|ms\n');
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
                    result = mapper({
                        rt: {
                            timestamps: {},
                            events: {},
                            durations: {
                                load: 2
                            }
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'bar.rt.load:2|ms\n');
                });
            });
        });
    });
});

