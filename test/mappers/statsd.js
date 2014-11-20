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
                    }, 'wibble');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'rt.firstbyte:2|ms',
                        'rt.lastbyte:3|ms',
                        'rt.load:4|ms',
                        'navtiming.unload:10|ms',
                        'navtiming.redirect:11|ms',
                        'navtiming.dns:12|ms',
                        'navtiming.connect:13|ms',
                        'navtiming.response:14|ms',
                        'navtiming.dom:15|ms',
                        'navtiming.domContent:16|ms',
                        'navtiming.load:17|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.redirect:22|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.dns:23|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.connect:24|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.response:25|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.redirect:30|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.dns:31|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.connect:32|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.response:33|ms',
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

            suite('call mapper with zero value:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        rt: {
                            timestamps: {},
                            events: {},
                            durations: {
                                load: 0
                            }
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, '');
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

