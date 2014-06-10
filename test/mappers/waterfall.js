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

var assert, jsdom, packageInfo, modulePath;

assert = require('chai').assert;
jsdom = require('jsdom').jsdom;
packageInfo = require('../../package.json');
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

        test('initialise does not throw with empty arguments', function () {
            assert.doesNotThrow(function () {
                waterfall.initialise({});
            });
        });

        suite('call initialise with default arguments:', function () {
            var mapper;

            setup(function () {
                mapper = waterfall.initialise({});
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

                suite('parse result:', function () {
                    var document;

                    setup(function () {
                        document = jsdom(result).parentWindow.document;
                    });

                    teardown(function () {
                        document = undefined;
                    });

                    test('generator is correct', function () {
                        assert.strictEqual(
                            document.querySelector('meta[name="generator"]').content,
                            'boomcatch ' + packageInfo.version
                        );
                    });

                    test('title is correct', function () {
                        assert.strictEqual(
                            document.querySelector('title').innerHTML,
                            'baz'
                        );
                    });

                    test('h1 is correct', function () {
                        var h1 = document.querySelectorAll('h1');

                        assert.strictEqual(h1.length, 1);
                        assert.strictEqual(h1[0].innerHTML, 'baz');
                    });

                    test('svg seems correct', function () {
                        assert.strictEqual(document.querySelectorAll('svg').length, 1);
                        assert.strictEqual(document.querySelectorAll('g').length, 5);
                        assert.strictEqual(document.querySelectorAll('svg > g').length, 2);
                        assert.strictEqual(document.querySelectorAll('rect').length, 14);
                        assert.strictEqual(document.querySelectorAll('text').length, 8);
                        assert.strictEqual(document.querySelectorAll('line').length, 5);
                        assert.notEqual(result.indexOf('<svg width="960px" height="98px">'), -1);
                        assert.notEqual(result.indexOf('<g transform="translate(0, 0)" data-resource="0">'), -1);
                        assert.notEqual(result.indexOf('<g transform="translate(0, 24)" data-resource="1">'), -1);
                    });

                    test('colour key seems correct', function () {
                        assert.strictEqual(document.querySelectorAll('table.key').length, 1);
                        assert.strictEqual(document.querySelectorAll('table.key th').length, 2);
                        assert.strictEqual(document.querySelectorAll('table.key > tbody > tr').length, 6);
                    });

                    test('raw data seems correct', function () {
                        assert.strictEqual(document.querySelectorAll('[data-raw] table').length, 1);
                        assert.strictEqual(document.querySelectorAll('[data-raw] th').length, 14);
                        assert.strictEqual(document.querySelectorAll('[data-raw] table > tbody > tr').length, 2);
                    });

                    test('mouseover details seem correct', function () {
                        assert.strictEqual(document.querySelectorAll('.resource-detail').length, 2);
                        assert.strictEqual(document.querySelectorAll('.resource-detail .resource-type').length, 2);
                        assert.strictEqual(document.querySelectorAll('.resource-detail .resource-start').length, 12);
                        assert.strictEqual(document.querySelectorAll('.resource-detail .resource-duration').length, 12);
                        assert.strictEqual(document.querySelectorAll('.resource-detail .resource-timing').length, 20);
                    });
                });
            });
        });
    });
});

