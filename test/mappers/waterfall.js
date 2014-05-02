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

var assert, modulePath;

assert = require('chai').assert;
modulePath = '../../src/mappers/waterfall';

suite('mappers/waterfall:', function () {
    test('require does not throw', function () {
        assert.doesNotThrow(function () {
            require(modulePath);
        });
    });

    test('require returns object', function () {
        assert.isObject(require(modulePath));
    });

    suite('require:', function () {
        var waterfall;

        setup(function () {
            waterfall = require(modulePath);
        });

        teardown(function () {
            waterfall = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(waterfall.initialise);
        });

        test('initialise does not throw', function () {
            assert.doesNotThrow(function () {
                waterfall.initialise();
            });
        });

        suite('call initialise:', function () {
            var mapper;

            setup(function () {
                mapper = waterfall.initialise();
            });

            teardown(function () {
                mapper = undefined;
            });

            test('function was returned', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper without restiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        rt: {
                            timestamps: {
                                start: 0
                            },
                            durations: {
                                firstbyte: 1,
                                lastbyte: 2,
                                load: 3
                            }
                        },
                        navtiming: {
                            type: '4',
                            timestamps: {
                                start: 5,
                                fetchStart: 6,
                                sslStart: 7,
                                requestStart: 8,
                                domInteractive: 9
                            },
                            events: {
                                unload: { start: 10, end: 11 },
                                redirect: { start: 12, end: 13 },
                                dns: { start: 14, end: 15 },
                                connect: { start: 16, end: 17 },
                                response: { start: 18, end: 19 },
                                dom: { start: 20, end: 21 },
                                domContent: { start: 22, end: 23 },
                                load: { start: 24, end: 25 }
                            }
                        }
                    }, 'foo');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was empty string', function () {
                    assert.strictEqual(result, '');
                });
            });

            suite('call mapper with restiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        restiming: [
                            {
                                name: 'foo',
                                type: 'css',
                                timestamps: {
                                    start: 1,
                                    fetchStart: 2,
                                    sslStart: 3,
                                    requestStart: 4
                                },
                                events: {
                                    redirect: { start: 5, end: 6 },
                                    dns: { start: 6, end: 8 },
                                    connect: { start: 7, end: 10 },
                                    response: { start: 8, end: 12 }
                                }
                            },
                            {
                                name: 'bar',
                                type: 'img',
                                timestamps: {
                                    start: 9,
                                    fetchStart: 10,
                                    sslStart: 11,
                                    requestStart: 12
                                },
                                events: {
                                    redirect: { start: 130, end: 180 },
                                    dns: { start: 140, end: 200 },
                                    connect: { start: 150, end: 220 },
                                    response: { start: 160, end: 240 }
                                }
                            }
                        ]
                    }, 'baz');
                });

                teardown(function () {
                    result = undefined;
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

                    test('data is array', function () {
                        assert.isArray(data);
                    });

                    test('data is correct length', function () {
                        assert.lengthOf(data, 2);
                    });

                    test('first datum is correct', function () {
                        assert.isObject(data[0]);
                        assert.lengthOf(Object.keys(data[0]), 5);
                        assert.strictEqual(data[0].page, 'baz');
                        assert.strictEqual(data[0].name, 'foo');
                        assert.strictEqual(data[0].type, 'css');
                        assert.strictEqual(data[0].start, 1);
                        assert.isArray(data[0].timings);
                        assert.lengthOf(data[0].timings, 5);
                    });

                    test('first redirect timing is correct', function () {
                        assert.isObject(data[0].timings[0]);
                        assert.lengthOf(Object.keys(data[0].timings[0]), 3);
                        assert.strictEqual(data[0].timings[0].name, 'redirect');
                        assert.strictEqual(data[0].timings[0].start, 5);
                        assert.strictEqual(data[0].timings[0].duration, 1);
                    });

                    test('first dns timing is correct', function () {
                        assert.strictEqual(data[0].timings[1].name, 'dns');
                        assert.strictEqual(data[0].timings[1].start, 6);
                        assert.strictEqual(data[0].timings[1].duration, 2);
                    });

                    test('first connect timing is correct', function () {
                        assert.strictEqual(data[0].timings[2].name, 'connect');
                        assert.strictEqual(data[0].timings[2].start, 7);
                        assert.strictEqual(data[0].timings[2].duration, 3);
                    });

                    test('first request timing is correct', function () {
                        assert.strictEqual(data[0].timings[3].name, 'request');
                        assert.strictEqual(data[0].timings[3].start, 4);
                        assert.strictEqual(data[0].timings[3].duration, 4);
                    });

                    test('first response timing is correct', function () {
                        assert.strictEqual(data[0].timings[4].name, 'response');
                        assert.strictEqual(data[0].timings[4].start, 8);
                        assert.strictEqual(data[0].timings[4].duration, 4);
                    });

                    test('second datum is correct', function () {
                        assert.strictEqual(data[1].page, 'baz');
                        assert.strictEqual(data[1].name, 'bar');
                        assert.strictEqual(data[1].type, 'img');
                        assert.strictEqual(data[1].start, 9);
                    });

                    test('second redirect timing is correct', function () {
                        assert.strictEqual(data[1].timings[0].name, 'redirect');
                        assert.strictEqual(data[1].timings[0].start, 130);
                        assert.strictEqual(data[1].timings[0].duration, 50);
                    });

                    test('second dns timing is correct', function () {
                        assert.strictEqual(data[1].timings[1].name, 'dns');
                        assert.strictEqual(data[1].timings[1].start, 140);
                        assert.strictEqual(data[1].timings[1].duration, 60);
                    });

                    test('second connect timing is correct', function () {
                        assert.strictEqual(data[1].timings[2].name, 'connect');
                        assert.strictEqual(data[1].timings[2].start, 150);
                        assert.strictEqual(data[1].timings[2].duration, 70);
                    });

                    test('second request timing is correct', function () {
                        assert.strictEqual(data[1].timings[3].name, 'request');
                        assert.strictEqual(data[1].timings[3].start, 12);
                        assert.strictEqual(data[1].timings[3].duration, 148);
                    });

                    test('second response timing is correct', function () {
                        assert.strictEqual(data[1].timings[4].name, 'response');
                        assert.strictEqual(data[1].timings[4].start, 160);
                        assert.strictEqual(data[1].timings[4].duration, 80);
                    });
                });
            });

            suite('call mapper with minimal data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        restiming: [
                            {
                                name: 'wibble',
                                type: 'css',
                                timestamps: {
                                    start: 42,
                                    fetchStart: 420
                                },
                                events: {}
                            }
                        ]
                    }, 'referer');
                });

                teardown(function () {
                    result = undefined;
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

                    test('data is correct length', function () {
                        assert.lengthOf(data, 1);
                    });

                    test('datum is correct', function () {
                        assert.strictEqual(data[0].page, 'referer');
                        assert.strictEqual(data[0].name, 'wibble');
                        assert.strictEqual(data[0].type, 'css');
                        assert.strictEqual(data[0].start, 42);
                    });

                    test('redirect timing is correct', function () {
                        assert.strictEqual(data[0].timings[0].name, 'redirect');
                        assert.strictEqual(data[0].timings[0].start, 42);
                        assert.strictEqual(data[0].timings[0].duration, 0);
                    });

                    test('dns timing is correct', function () {
                        assert.strictEqual(data[0].timings[1].name, 'dns');
                        assert.strictEqual(data[0].timings[1].start, 42);
                        assert.strictEqual(data[0].timings[1].duration, 0);
                    });

                    test('connect timing is correct', function () {
                        assert.strictEqual(data[0].timings[2].name, 'connect');
                        assert.strictEqual(data[0].timings[2].start, 42);
                        assert.strictEqual(data[0].timings[2].duration, 0);
                    });

                    test('request timing is correct', function () {
                        assert.strictEqual(data[0].timings[3].name, 'request');
                        assert.strictEqual(data[0].timings[3].start, 42);
                        assert.strictEqual(data[0].timings[3].duration, 0);
                    });

                    test('response timing is correct', function () {
                        assert.strictEqual(data[0].timings[4].name, 'response');
                        assert.strictEqual(data[0].timings[4].start, 42);
                        assert.strictEqual(data[0].timings[4].duration, 0);
                    });
                });
            });
        });
    });
});

