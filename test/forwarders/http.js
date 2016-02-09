// Copyright © 2014, 2015, 2016 Springer Nature
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

var mockery, assert, spooks, modulePath, nop;

mockery = require('mockery');
assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/forwarders/http';

nop = function () {};

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('ftp');

suite('forwarders/http:', function () {
    var log, request;

    setup(function () {
        log = {};
        request = {
            on: spooks.fn({
                name: 'on',
                log: log
            }),
            write: spooks.fn({
                name: 'write',
                log: log
            }),
            end: spooks.fn({
                name: 'end',
                log: log
            })
        };
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('querystring', {
            stringify: spooks.fn({
                name: 'stringify',
                log: log,
                results: [ 'stringify result' ]
            })
        });
        mockery.registerMock('http', {
            request: spooks.fn({
                name: 'http',
                log: log,
                results: [ request ]
            })
        });
        mockery.registerMock('https', {
            request: spooks.fn({
                name: 'https',
                log: log,
                results: [ request ]
            })
        });
    });

    teardown(function () {
        mockery.deregisterMock('querystring');
        mockery.deregisterMock('http');
        mockery.deregisterMock('https');
        mockery.disable();
        log = request = undefined;
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
        var http;

        setup(function () {
            http = require(modulePath);
        });

        teardown(function () {
            http = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(http.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                http.initialise();
            });
        });

        test('initialise throws with empty options', function () {
            assert.throws(function () {
                http.initialise({});
            });
        });

        test('initialise does not throw with fwdUrl option', function () {
            assert.doesNotThrow(function () {
                http.initialise({
                    fwdUrl: 'http://www.example.com'
                });
            });
        });

        test('initialise does not throw with https fwdUrl option', function () {
            assert.doesNotThrow(function () {
                http.initialise({
                    fwdUrl: 'https://www.example.com'
                });
            });
        });

        test('initialise throws with invalid fwdUrl option', function () {
            assert.throws(function () {
                http.initialise({
                    fwdUrl: 'ftp://www.example.com'
                });
            });
        });

        suite('call initialise with default method:', function () {
            var forwarder;

            setup(function () {
                forwarder = http.initialise({
                    fwdUrl: 'http://www.example.com'
                });
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(forwarder);
            });

            test('forwarder throws without data', function () {
                assert.throws(function () {
                    forwarder();
                });
            });

            test('forwarder does not throw with data', function () {
                assert.doesNotThrow(function () {
                    forwarder('');
                });
            });

            test('querystring.stringify was not called', function () {
                assert.strictEqual(log.counts.stringify, 0);
            });

            test('http.request was not called', function () {
                assert.strictEqual(log.counts.http, 0);
            });

            test('https.request was not called', function () {
                assert.strictEqual(log.counts.https, 0);
            });

            test('request.on was not called', function () {
                assert.strictEqual(log.counts.on, 0);
            });

            suite('call forwarder:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('foo bar', null, null, callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('querystring.stringify was not called', function () {
                    assert.strictEqual(log.counts.stringify, 0);
                });

                test('http.request was called once', function () {
                    assert.strictEqual(log.counts.http, 1);
                });

                test('http.request was called correctly', function () {
                    assert.strictEqual(log.these.http[0], require('http'));
                    assert.lengthOf(log.args.http[0], 2);
                    assert.isObject(log.args.http[0][0]);
                    assert.strictEqual(log.args.http[0][0].protocol, 'http:');
                    assert.strictEqual(log.args.http[0][0].host, 'www.example.com');
                    assert.strictEqual(log.args.http[0][0].hostname, 'www.example.com');
                    assert.strictEqual(log.args.http[0][0].path, '/?foo bar');
                    assert.strictEqual(log.args.http[0][0].pathname, '/');
                    assert.strictEqual(log.args.http[0][0].href, 'http://www.example.com/');
                    assert.strictEqual(log.args.http[0][0].method, 'GET');
                    assert.isObject(log.args.http[0][0].headers);
                    assert.strictEqual(log.args.http[0][0].headers['Content-Type'], 'text/plain');
                    assert.isFunction(log.args.http[0][1]);
                });

                test('request.on was called once', function () {
                    assert.strictEqual(log.counts.on, 1);
                });

                test('request.on was called correctly', function () {
                    assert.strictEqual(log.these.on[0], request);
                    assert.lengthOf(log.args.on[0], 2);
                    assert.strictEqual(log.args.on[0][0], 'error');
                    assert.strictEqual(log.args.on[0][1], callback);
                });

                test('request.end was not called', function () {
                    assert.strictEqual(log.counts.end, 0);
                });

                suite('call response handler:', function () {
                    var response;

                    setup(function () {
                        response = {
                            on: spooks.fn({
                                name: 'on',
                                log: log
                            })
                        };
                        log.args.http[0][1](response);
                    });

                    teardown(function () {
                        response = undefined;
                    });

                    test('request.write was not called', function () {
                        assert.strictEqual(log.counts.write, 0);
                    });

                    test('request.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('request.end was called correctly', function () {
                        assert.strictEqual(log.these.end[0], request);
                        assert.lengthOf(log.args.end[0], 0);
                    });

                    test('response.on was called once', function () {
                        assert.strictEqual(log.counts.on, 2);
                    });

                    test('response.on was called correctly', function () {
                        assert.strictEqual(log.these.on[1], response);
                        assert.lengthOf(log.args.on[1], 2);
                        assert.strictEqual(log.args.on[1][0], 'close');
                        assert.isFunction(log.args.on[1][1]);
                        assert.notEqual(log.args.on[1][1], callback);
                    });

                    test('callback was not called', function () {
                        assert.strictEqual(log.counts.callback, 0);
                    });

                    suite('call close event handler:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('callback was called once', function () {
                            assert.strictEqual(log.counts.callback, 1);
                        });

                        test('callback was called correctly', function () {
                            assert.isNull(log.these.callback[0]);
                            assert.lengthOf(log.args.callback[0], 2);
                            assert.isNull(log.args.callback[0][0]);
                            assert.strictEqual(log.args.callback[0][1], 7);
                        });
                    });
                });
            });

            suite('call forwarder with alternative data:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder({ foo: 'bar', baz: 'qux' }, null, null, callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('querystring.stringify was called once', function () {
                    assert.strictEqual(log.counts.stringify, 1);
                });

                test('querystring.stringify was called correctly', function () {
                    assert.strictEqual(log.these.stringify[0], require('querystring'));
                    assert.lengthOf(log.args.stringify[0], 1);
                    assert.isObject(log.args.stringify[0][0]);
                    assert.lengthOf(Object.keys(log.args.stringify[0][0]), 2);
                    assert.strictEqual(log.args.stringify[0][0].foo, 'bar');
                    assert.strictEqual(log.args.stringify[0][0].baz, 'qux');
                });

                test('http.request was called once', function () {
                    assert.strictEqual(log.counts.http, 1);
                });

                test('http.request was called correctly', function () {
                    assert.strictEqual(log.args.http[0][0].path, '/?stringify result');
                });

                test('request.on was called once', function () {
                    assert.strictEqual(log.counts.on, 1);
                });

                suite('call response handler:', function () {
                    var response;

                    setup(function () {
                        response = {
                            on: spooks.fn({
                                name: 'on',
                                log: log
                            })
                        };
                        log.args.http[0][1](response);
                    });

                    teardown(function () {
                        response = undefined;
                    });

                    test('request.write was not called', function () {
                        assert.strictEqual(log.counts.write, 0);
                    });

                    test('request.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('request.on was called once', function () {
                        assert.strictEqual(log.counts.on, 2);
                    });

                    test('callback was not called', function () {
                        assert.strictEqual(log.counts.callback, 0);
                    });

                    suite('call close event handler:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('callback was called once', function () {
                            assert.strictEqual(log.counts.callback, 1);
                        });

                        test('callback was called correctly', function () {
                            assert.strictEqual(log.args.callback[0][1], 16);
                        });
                    });
                });
            });

            suite('call forwarder with json type:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('foo bar', 'json', null, callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('http.request was called correctly', function () {
                    assert.strictEqual(log.args.http[0][0].headers['Content-Type'], 'application/json');
                });
            });

            suite('call forwarder with html type:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('foo bar', 'html', null, callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('http.request was called correctly', function () {
                    assert.strictEqual(log.args.http[0][0].headers['Content-Type'], 'text/html');
                });
            });
        });

        suite('call initialise with custom method:', function () {
            var forwarder;

            setup(function () {
                forwarder = http.initialise({
                    fwdUrl: 'https://www.example.com',
                    fwdMethod: 'POST'
                });
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('querystring.stringify was not called', function () {
                assert.strictEqual(log.counts.stringify, 0);
            });

            test('http.request was not called', function () {
                assert.strictEqual(log.counts.http, 0);
            });

            test('https.request was not called', function () {
                assert.strictEqual(log.counts.https, 0);
            });

            test('request.on was not called', function () {
                assert.strictEqual(log.counts.on, 0);
            });

            suite('call forwarder:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('foo bar', null, null, callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('querystring.stringify was not called', function () {
                    assert.strictEqual(log.counts.stringify, 0);
                });

                test('https.request was called once', function () {
                    assert.strictEqual(log.counts.https, 1);
                });

                test('https.request was called correctly', function () {
                    assert.strictEqual(log.these.https[0], require('https'));
                    assert.lengthOf(log.args.https[0], 2);
                    assert.isObject(log.args.https[0][0]);
                    assert.strictEqual(log.args.https[0][0].protocol, 'https:');
                    assert.strictEqual(log.args.https[0][0].host, 'www.example.com');
                    assert.strictEqual(log.args.https[0][0].hostname, 'www.example.com');
                    assert.strictEqual(log.args.https[0][0].path, '/');
                    assert.strictEqual(log.args.https[0][0].pathname, '/');
                    assert.strictEqual(log.args.https[0][0].href, 'https://www.example.com/');
                    assert.strictEqual(log.args.https[0][0].method, 'POST');
                    assert.isFunction(log.args.https[0][1]);
                    assert.isFunction(log.args.https[0][1]);
                });

                test('request.on was called once', function () {
                    assert.strictEqual(log.counts.on, 1);
                });

                test('request.end was not called', function () {
                    assert.strictEqual(log.counts.end, 0);
                });

                suite('call response handler:', function () {
                    var response;

                    setup(function () {
                        response = {
                            on: spooks.fn({
                                name: 'on',
                                log: log
                            })
                        };
                        log.args.https[0][1](response);
                    });

                    teardown(function () {
                        response = undefined;
                    });

                    test('request.write was not called', function () {
                        assert.strictEqual(log.counts.write, 1);
                    });

                    test('request.write was called correctly', function () {
                        assert.strictEqual(log.these.write[0], request);
                        assert.lengthOf(log.args.write[0], 1);
                        assert.strictEqual(log.args.write[0][0], 'foo bar');
                    });

                    test('request.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('request.on was called once', function () {
                        assert.strictEqual(log.counts.on, 2);
                    });

                    test('callback was not called', function () {
                        assert.strictEqual(log.counts.callback, 0);
                    });

                    suite('call close event handler:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('callback was called once', function () {
                            assert.strictEqual(log.counts.callback, 1);
                        });
                    });
                });
            });
        });
    });
});

