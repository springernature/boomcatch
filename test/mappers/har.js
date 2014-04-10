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
            result: {
                toJSON: function () {
                    log.counts.toJSON += 1;
                    log.these.toJSON.push(this);
                    log.args.toJSON.push(arguments);
                    return browser;
                }
            }
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
                        navtiming: {
                            type: '0',
                            timestamps: {
                                start: 1,
                                fetchStart: 2,
                                sslStart: 3,
                                requestStart: 4,
                                domInteractive: 5
                            },
                            events: {
                                unload: { start: 6, end: 7 },
                                redirect: { start: 8, end: 9 },
                                dns: { start: 10, end: 11 },
                                connect: { start: 12, end: 13 },
                                response: { start: 14, end: 15 },
                                dom: { start: 16, end: 17 },
                                domContent: { start: 18, end: 19 },
                                load: { start: 20, end: 21 }
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

            suite('call mapper without navtiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        restiming: [
                            {
                                name: 'http://www.example.com/foo?bar=baz#qux',
                                type: 'css',
                                timestamps: {
                                    start: 1,
                                    fetchStart: 2,
                                    sslStart: 3,
                                    requestStart: 4
                                },
                                events: {
                                    redirect: { start: 5, end: 6 },
                                    dns: { start: 7, end: 8 },
                                    connect: { start: 10, end: 11 },
                                    response: { start: 12, end: 13 }
                                }
                            },
                            {
                                name: 'https://nature.com/wibble?k=v&l=w',
                                type: 'img',
                                timestamps: {
                                    start: 14,
                                    fetchStart: 15,
                                    sslStart: 16,
                                    requestStart: 17
                                },
                                events: {
                                    redirect: { start: 18, end: 19 },
                                    dns: { start: 20, end: 21 },
                                    connect: { start: 22, end: 23 },
                                    response: { start: 24, end: 25 }
                                }
                            }
                        ]
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
                        title: 'wibble',
                        navtiming: {
                            type: '0',
                            timestamps: {
                                start: 1,
                                fetchStart: 2,
                                sslStart: 3,
                                requestStart: 4,
                                domInteractive: 5
                            },
                            events: {
                                unload: { start: 6, end: 12 },
                                redirect: { start: 7, end: 14 },
                                dns: { start: 8, end: 16 },
                                connect: { start: 9, end: 18 },
                                response: { start: 10, end: 20 },
                                dom: { start: 11, end: 22 },
                                domContent: { start: 12, end: 24 },
                                load: { start: 13, end: 26 }
                            }
                        },
                        restiming: [
                            {
                                name: 'http://www.example.com/foo?bar=baz#qux',
                                type: 'img',
                                timestamps: {
                                    start: 14,
                                    fetchStart: 15,
                                    sslStart: 16,
                                    requestStart: 17
                                },
                                events: {
                                    redirect: { start: 18, end: 36 },
                                    dns: { start: 19, end: 38 },
                                    connect: { start: 20, end: 40 },
                                    response: { start: 21, end: 42 }
                                }
                            },
                            {
                                name: 'https://nature.com/wibble?k=v&l=w',
                                type: 'css',
                                timestamps: {
                                    start: 220,
                                    fetchStart: 230,
                                    sslStart: 240,
                                    requestStart: 250
                                },
                                events: {
                                    redirect: { start: 280, end: 560 },
                                    dns: { start: 290, end: 580 },
                                    connect: { start: 300, end: 600 },
                                    response: { start: 310, end: 320 }
                                }
                            }
                        ]
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
                        assert.strictEqual(data.log.pages[0].title, 'wibble');
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
                        assert.strictEqual(data.log.entries[1].time, 670);
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
                        assert.strictEqual(data.log.entries[1].timings.receive, 10);
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
                        navtiming: {
                            type: '0',
                            timestamps: {
                                start: 100,
                                fetchStart: 200,
                                sslStart: 300,
                                requestStart: 400,
                                domInteractive: 500
                            },
                            events: {
                                unload: { start: 600, end: 1200 },
                                redirect: { start: 700, end: 1400 },
                                dns: { start: 800, end: 1600 },
                                connect: { start: 900, end: 1800 },
                                response: { start: 1000, end: 2000 },
                                dom: { start: 1100, end: 2200 },
                                domContent: { start: 1200, end: 2400 },
                                load: { start: 1300, end: 2600 }
                            }
                        },
                        restiming: [
                            {
                                name: 'http://example.com/?a=b&c=d',
                                type: 'css',
                                timestamps: {
                                    start: 1400,
                                    fetchStart: 1500
                                },
                                events: {}
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

