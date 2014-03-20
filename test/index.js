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

var assert, mockery, spooks, modulePath, nop, restrict;

assert = require('chai').assert;
mockery = require('mockery');
spooks = require('spooks');

modulePath = '../src';

nop = function () {};

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('qs');
mockery.registerAllowable('get-off-my-log');

suite('index:', function () {
    var log;

    setup(function () {
        log = {};
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('http', spooks.obj({
            archetype: { createServer: nop, listen: nop },
            log: log,
            chains: { createServer: true }
        }));
        mockery.registerMock('./validators/permissive', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'validator',
                    log: log,
                    result: true
                })
            }
        }));
        mockery.registerMock('./mappers/statsd', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'mapper',
                    log: log,
                    result: 'default mapped data'
                })
            }
        }));
        mockery.registerMock('./forwarders/udp', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'forwarder',
                    log: log
                })
            }
        }));
        mockery.registerMock('./validators/restrictive', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: function () {
                    log.counts.validator += 1;
                    log.these.validator.push(this);
                    log.args.validator.push(arguments);
                    return !restrict;
                }
            }
        }));
        mockery.registerMock('./mappers/mapper', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'mapper',
                    log: log,
                    result: 'alternative mapped data'
                })
            }
        }));
        mockery.registerMock('./forwarders/forwarder', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'forwarder',
                    log: log
                })
            }
        }));
        mockery.registerMock('./mappers/failing', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'mapper',
                    log: log,
                    result: ''
                })
            }
        }));
    });

    teardown(function () {
        mockery.deregisterMock('./mappers/failing');
        mockery.deregisterMock('./forwarders/forwarder');
        mockery.deregisterMock('./mappers/mapper');
        mockery.deregisterMock('./validators/restrictive');
        mockery.deregisterMock('./forwarders/udp');
        mockery.deregisterMock('./mappers/statsd');
        mockery.deregisterMock('./validators/permissive');
        mockery.deregisterMock('http');
        mockery.disable();
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
        var boomcatch;

        setup(function () {
            boomcatch = require(modulePath);
        });

        teardown(function () {
            boomcatch = undefined;
        });

        test('listen function is exported', function () {
            assert.isFunction(boomcatch.listen);
        });

        test('listen does not throw without options', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen();
            });
        });

        test('listen throws if host is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if port is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: '80',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if path is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if referer is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: 'bar',
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if origin is not a URL', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'baz',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if limit is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: '100',
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if maxSize is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: '1024',
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if log is object', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if validator is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: '',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if mapper is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: '',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if prefix is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: '',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if forwarder is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: '',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if fwdHost is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '',
                    fwdPort: 8125
                });
            });
        });

        test('listen throws if fwdPort is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: '8125'
                });
            });
        });

        test('listen does not throw if options are valid', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125
                });
            });
        });

        test('listen does not throw if options are null', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen({
                    host: null,
                    port: null,
                    path: null,
                    referer: null,
                    origin: null,
                    limit: null,
                    maxSize: null,
                    log: null,
                    validator: null,
                    mapper: null,
                    prefix: null,
                    forwarder: null,
                    fwdHost: null,
                    fwdPort: null
                });
            });
        });

        suite('call listen with default options:', function () {
            setup(function () {
                boomcatch.listen();
            });

            test('?.initialise was called three times', function () {
                assert.strictEqual(log.counts.initialise, 3);
            });

            test('validator.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./validators/permissive'));
                assert.lengthOf(log.args.initialise[0], 1);
                assert.isObject(log.args.initialise[0][0]);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./mappers/statsd'));
                assert.lengthOf(log.args.initialise[1], 1);
                assert.isObject(log.args.initialise[1][0]);
                assert.isUndefined(log.args.initialise[1][0].prefix);
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./forwarders/udp'));
                assert.lengthOf(log.args.initialise[2], 1);
                assert.isObject(log.args.initialise[2][0]);
                assert.isUndefined(log.args.initialise[2][0].fwdHost);
                assert.isUndefined(log.args.initialise[2][0].fwdPort);
            });

            test('http.createServer was called once', function () {
                assert.strictEqual(log.counts.createServer, 1);
            });

            test('http.createServer was called correctly', function () {
                assert.strictEqual(log.these.createServer[0], require('http'));
                assert.lengthOf(log.args.createServer[0], 1);
                assert.isFunction(log.args.createServer[0][0]);
            });

            test('http.listen was called once', function () {
                assert.strictEqual(log.counts.listen, 1);
            });

            test('http.listen was called correctly', function () {
                assert.strictEqual(log.these.listen[0], require('http').createServer());
                assert.lengthOf(log.args.listen[0], 2);
                assert.strictEqual(log.args.listen[0][0], 80);
                assert.strictEqual(log.args.listen[0][1], '0.0.0.0');
            });

            suite('invalid path:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/foo?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {},
                        socket: {
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.setHeader was called correctly first time', function () {
                    assert.strictEqual(log.these.setHeader[0], response);
                    assert.lengthOf(log.args.setHeader[0], 2);
                    assert.strictEqual(log.args.setHeader[0][0], 'Access-Control-Allow-Origin');
                    assert.strictEqual(log.args.setHeader[0][1], '*');
                });

                test('response.setHeader was called correctly second time', function () {
                    assert.strictEqual(log.these.setHeader[1], response);
                    assert.lengthOf(log.args.setHeader[1], 2);
                    assert.strictEqual(log.args.setHeader[1][0], 'Content-Type');
                    assert.strictEqual(log.args.setHeader[1][1], 'application/json');
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.these.end[0], response);
                    assert.lengthOf(log.args.end[0], 1);
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid path `/foo`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 404);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.socket.destroy was called correctly', function () {
                    assert.strictEqual(log.these.destroy[0], request.socket);
                    assert.lengthOf(log.args.destroy[0], 0);
                });
            });

            suite('invalid method:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'PUT',
                        headers: {},
                        socket: {
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid method `PUT`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 405);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.these.setHeader[0], response);
                    assert.lengthOf(log.args.setHeader[0], 2);
                    assert.strictEqual(log.args.setHeader[0][0], 'Access-Control-Allow-Origin');
                    assert.strictEqual(log.args.setHeader[0][1], '*');
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                test('request.on was called correctly first time', function () {
                    assert.lengthOf(log.args.on[0], 2);
                    assert.strictEqual(log.args.on[0][0], 'data');
                    assert.isFunction(log.args.on[0][1]);
                });

                test('request.on was called correctly second time', function () {
                    assert.lengthOf(log.args.on[1], 2);
                    assert.strictEqual(log.args.on[1][0], 'end');
                    assert.isFunction(log.args.on[1][1]);
                });

                suite('receive body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('x');
                    });

                    test('response.setHeader was called once', function () {
                        assert.strictEqual(log.counts.setHeader, 2);
                    });

                    test('response.setHeader was called correctly', function () {
                        assert.strictEqual(log.args.setHeader[1][0], 'Content-Type');
                        assert.strictEqual(log.args.setHeader[1][1], 'application/json');
                    });

                    test('response.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('response.end was called correctly', function () {
                        assert.strictEqual(log.args.end[0][0], '{ "error": "Body too large" }');
                    });

                    test('response.statusCode was set correctly', function () {
                        assert.strictEqual(response.statusCode, 413);
                    });

                    test('request.socket.destroy was called once', function () {
                        assert.strictEqual(log.counts.destroy, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('request.socket.destroy not called', function () {
                            assert.strictEqual(log.counts.destroy, 1);
                        });
                    });
                });

                suite('end request:', function () {
                    setup(function () {
                        console.log(typeof log.args.on[1][1]);
                        console.log(log.args.on[1][1]);
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isUndefined(log.these.mapper[0]);
                        assert.lengthOf(log.args.mapper[0], 2);
                        assert.isObject(log.args.mapper[0][0]);
                        assert.isObject(log.args.mapper[0][0].boomerang);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.start, 1);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.firstbyte, 2);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.load, 3);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isUndefined(log.args.mapper[0][0].restiming);
                        assert.strictEqual(log.args.mapper[0][1], 'blah');
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('forwarder was called correctly', function () {
                        assert.isUndefined(log.these.forwarder[0]);
                        assert.lengthOf(log.args.forwarder[0], 3);
                        assert.strictEqual(log.args.forwarder[0][0], 'default mapped data');
                        assert.isUndefined(log.args.forwarder[0][1]);
                        assert.isFunction(log.args.forwarder[0][2]);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    suite('error:', function () {
                        setup(function () {
                            log.args.forwarder[0][1]('wibble');
                        });

                        test('response.setHeader was called once', function () {
                            assert.strictEqual(log.counts.setHeader, 2);
                        });

                        test('response.setHeader was called correctly', function () {
                            assert.strictEqual(log.args.setHeader[1][0], 'Content-Type');
                            assert.strictEqual(log.args.setHeader[1][1], 'application/json');
                        });

                        test('response.end was called once', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('response.end was called correctly', function () {
                            assert.strictEqual(log.args.end[0][0], '{ "error": "wibble" }');
                        });

                        test('response.statusCode was set correctly', function () {
                            assert.strictEqual(response.statusCode, 502);
                        });

                        test('request.socket.destroy was called once', function () {
                            assert.strictEqual(log.counts.destroy, 1);
                        });
                    });

                    suite('success:', function () {
                        setup(function () {
                            log.args.forwarder[0][1](null, 1977);
                        });

                        test('response.setHeader was not called', function () {
                            assert.strictEqual(log.counts.setHeader, 1);
                        });

                        test('response.end was called once', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('response.end was called correctly', function () {
                            assert.lengthOf(log.args.end[0], 0);
                        });

                        test('response.statusCode was set correctly', function () {
                            assert.strictEqual(response.statusCode, 204);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });
                    });
                });
            });

            suite('invalid query string:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2',
                        method: 'GET',
                        headers: {
                            referer: 'wibble'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.on[1][1]();
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                test('mapper was called once', function () {
                    assert.strictEqual(log.counts.mapper, 1);
                });

                test('mapper was called correctly', function () {
                    assert.isUndefined(log.args.mapper[0][0].boomerang);
                    assert.isUndefined(log.args.mapper[0][0].navtiming);
                    assert.isUndefined(log.args.mapper[0][0].restiming);
                    assert.strictEqual(log.args.mapper[0][1], 'wibble');
                });

                test('forwarder was called once', function () {
                    assert.strictEqual(log.counts.forwarder, 1);
                });

                test('response.end was not called', function () {
                    assert.strictEqual(log.counts.end, 0);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });
            });

            suite('request with navigation timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=10&t_done=20&nt_nav_st=30&nt_red_st=40&nt_red_end=50&nt_fet_st=60&nt_dns_st=70&nt_dns_end=80&nt_con_st=90&nt_con_end=100&nt_res_st=110&nt_domcontloaded_st=120&nt_load_st=130',
                        method: 'GET',
                        headers: {
                            referer: 'wibble'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isObject(log.args.mapper[0][0].boomerang);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.firstbyte, 10);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.load, 20);
                        assert.isObject(log.args.mapper[0][0].navtiming);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.start, 30);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.redirect, 10);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.dns, 10);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.connect, 10);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.firstbyte, 50);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.domload, 60);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.load, 70);
                        assert.isUndefined(log.args.mapper[0][0].restiming);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });
                });
            });

            suite('request with resource timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=10&t_done=20&restiming%5B0%5D%5Brt_name%5D=foo&restiming%5B0%5D%5Brt_in_type%5D=css&restiming%5B0%5D%5Brt_st%5D=30&restiming%5B0%5D%5Brt_dur%5D=40&restiming%5B0%5D%5Brt_red_st%5D=50&restiming%5B0%5D%5Brt_red_end%5D=60&restiming%5B0%5D%5Brt_fet_st%5D=70&restiming%5B0%5D%5Brt_dns_st%5D=80&restiming%5B0%5D%5Brt_dns_end%5D=90&restiming%5B0%5D%5Brt_con_st%5D=100&restiming%5B0%5D%5Brt_con_end%5D=110&restiming%5B0%5D%5Brt_scon_st%5D=120&restiming%5B0%5D%5Brt_req_st%5D=130&restiming%5B0%5D%5Brt_res_st%5D=140&restiming%5B0%5D%5Brt_res_end%5D=150&restiming%5B1%5D%5Brt_name%5D=bar&restiming%5B1%5D%5Brt_in_type%5D=img&restiming%5B1%5D%5Brt_st%5D=160&restiming%5B1%5D%5Brt_dur%5D=170&restiming%5B1%5D%5Brt_red_st%5D=180&restiming%5B1%5D%5Brt_red_end%5D=190&restiming%5B1%5D%5Brt_fet_st%5D=200&restiming%5B1%5D%5Brt_dns_st%5D=210&restiming%5B1%5D%5Brt_dns_end%5D=220&restiming%5B1%5D%5Brt_con_st%5D=230&restiming%5B1%5D%5Brt_con_end%5D=240&restiming%5B1%5D%5Brt_scon_st%5D=250&restiming%5B1%5D%5Brt_req_st%5D=260&restiming%5B1%5D%5Brt_res_st%5D=270&restiming%5B1%5D%5Brt_res_end%5D=280',
                        method: 'GET',
                        headers: {
                            referer: 'wibble'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isObject(log.args.mapper[0][0].boomerang);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.start, 10);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.load, 20);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isArray(log.args.mapper[0][0].restiming);
                        assert.lengthOf(log.args.mapper[0][0].restiming, 2);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].name, 'foo');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].type, 'css');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].start, 30);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].redirect, 10);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].dns, 10);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].connect, 10);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].firstbyte, 110);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].load, 40);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].name, 'bar');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].type, 'img');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].start, 160);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].redirect, 10);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].dns, 10);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].connect, 10);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].firstbyte, 110);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].load, 170);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });
                });
            });

            suite('request without restricted resource timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_done=10&restiming%5B0%5D%5Brt_name%5D=foo&restiming%5B0%5D%5Brt_in_type%5D=css&restiming%5B0%5D%5Brt_st%5D=20&restiming%5B0%5D%5Brt_dur%5D=30&restiming%5B0%5D%5Brt_fet_st%5D=40&restiming%5B0%5D%5Brt_req_st%5D=50&restiming%5B0%5D%5Brt_res_end%5D=60&restiming%5B1%5D%5Brt_name%5D=bar&restiming%5B1%5D%5Brt_in_type%5D=img&restiming%5B1%5D%5Brt_st%5D=70&restiming%5B1%5D%5Brt_dur%5D=80&restiming%5B1%5D%5Brt_fet_st%5D=90&restiming%5B1%5D%5Brt_req_st%5D=100&restiming%5B1%5D%5Brt_res_end%5D=110',
                        method: 'GET',
                        headers: {
                            referer: 'wibble'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isObject(log.args.mapper[0][0].boomerang);
                        assert.isUndefined(log.args.mapper[0][0].boomerang.start);
                        assert.isUndefined(log.args.mapper[0][0].boomerang.firstbyte);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.load, 10);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isArray(log.args.mapper[0][0].restiming);
                        assert.lengthOf(log.args.mapper[0][0].restiming, 2);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].name, 'foo');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].type, 'css');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].start, 20);
                        assert.isUndefined(log.args.mapper[0][0].restiming[0].redirect);
                        assert.isUndefined(log.args.mapper[0][0].restiming[0].dns);
                        assert.isUndefined(log.args.mapper[0][0].restiming[0].connect);
                        assert.isUndefined(log.args.mapper[0][0].restiming[0].firstbyte);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].load, 30);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].name, 'bar');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].type, 'img');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].start, 70);
                        assert.isUndefined(log.args.mapper[0][0].restiming[1].redirect);
                        assert.isUndefined(log.args.mapper[0][0].restiming[1].dns);
                        assert.isUndefined(log.args.mapper[0][0].restiming[1].connect);
                        assert.isUndefined(log.args.mapper[0][0].restiming[1].firstbyte);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].load, 80);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });
                });
            });

            suite('application/x-www-form-urlencoded POST request', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon',
                        method: 'POST',
                        headers: {
                            referer: 'wibble',
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3d1');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isObject(log.args.mapper[0][0].boomerang);
                            assert.isUndefined(log.args.mapper[0][0].boomerang.start);
                            assert.isUndefined(log.args.mapper[0][0].boomerang.firstbyte);
                            assert.strictEqual(log.args.mapper[0][0].boomerang.load, 1);
                            assert.isUndefined(log.args.mapper[0][0].navtiming);
                            assert.isUndefined(log.args.mapper[0][0].restiming);
                        });

                        test('forwarder was called once', function () {
                            assert.strictEqual(log.counts.forwarder, 1);
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 0);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });

                        suite('success:', function () {
                            setup(function () {
                                log.args.forwarder[0][1](null, 1);
                            });

                            test('response.setHeader was not called', function () {
                                assert.strictEqual(log.counts.setHeader, 1);
                            });

                            test('response.end was called once', function () {
                                assert.strictEqual(log.counts.end, 1);
                            });

                            test('response.statusCode was set correctly', function () {
                                assert.strictEqual(response.statusCode, 200);
                            });

                            test('request.socket.destroy was not called', function () {
                                assert.strictEqual(log.counts.destroy, 0);
                            });
                        });
                    });
                });

                suite('receive invalid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=%7Bt_done%3A1%7D');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isUndefined(log.args.mapper[0][0].boomerang);
                            assert.isUndefined(log.args.mapper[0][0].navtiming);
                            assert.isUndefined(log.args.mapper[0][0].restiming);
                        });
                    });
                });
            });

            suite('text/plain POST request', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon',
                        method: 'POST',
                        headers: {
                            referer: 'wibble',
                            'content-type': 'text/plain'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=%7B%22t_done%22%3A10%7D');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isObject(log.args.mapper[0][0].boomerang);
                            assert.isUndefined(log.args.mapper[0][0].boomerang.start);
                            assert.isUndefined(log.args.mapper[0][0].boomerang.firstbyte);
                            assert.strictEqual(log.args.mapper[0][0].boomerang.load, 10);
                            assert.isUndefined(log.args.mapper[0][0].navtiming);
                            assert.isUndefined(log.args.mapper[0][0].restiming);
                        });

                        test('forwarder was called once', function () {
                            assert.strictEqual(log.counts.forwarder, 1);
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 0);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });
                    });
                });

                suite('receive invalid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3d10');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was not called', function () {
                            assert.strictEqual(log.counts.mapper, 0);
                        });

                        test('forwarder was not called', function () {
                            assert.strictEqual(log.counts.forwarder, 0);
                        });

                        test('response.setHeader was called once', function () {
                            assert.strictEqual(log.counts.setHeader, 2);
                        });

                        test('response.end was called once', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('response.end was called correctly', function () {
                            assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid data" }');
                        });

                        test('response.statusCode was set correctly', function () {
                            assert.strictEqual(response.statusCode, 400);
                        });

                        test('request.socket.destroy was called once', function () {
                            assert.strictEqual(log.counts.destroy, 1);
                        });
                    });
                });
            });

            suite('invalid POST request', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon',
                        method: 'POST',
                        headers: {
                            referer: 'wibble',
                            'content-type': 'application/json'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 0);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid content type `application/json`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 415);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });
            });

            suite('immediately repeated request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {},
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });
        });

        suite('call listen with custom options:', function () {
            setup(function () {
                boomcatch.listen({
                    host: '192.168.1.1',
                    port: 8080,
                    path: '/foo/bar',
                    referer: /baz/,
                    origin: [ 'http://foo', 'http://bar' ],
                    limit: 1000,
                    maxSize: 15,
                    log: spooks.fn({
                        name: 'log',
                        log: log
                    }),
                    validator: 'restrictive',
                    mapper: 'mapper',
                    prefix: 'foo prefix',
                    forwarder: 'forwarder',
                    fwdHost: 'bar host',
                    fwdPort: 1234
                });
            });

            test('?.initialise was called twice', function () {
                assert.strictEqual(log.counts.initialise, 3);
            });

            test('validator.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./validators/restrictive'));
                assert.isObject(log.args.initialise[0][0]);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./mappers/mapper'));
                assert.strictEqual(log.args.initialise[1][0].prefix, 'foo prefix');
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./forwarders/forwarder'));
                assert.strictEqual(log.args.initialise[2][0].fwdHost, 'bar host');
                assert.strictEqual(log.args.initialise[2][0].fwdPort, 1234);
            });

            test('http.listen was called correctly', function () {
                assert.strictEqual(log.args.listen[0][0], 8080);
                assert.strictEqual(log.args.listen[0][1], '192.168.1.1');
            });

            test('log.info was called once', function () {
                assert.strictEqual(log.counts.log, 1);
                assert.lengthOf(log.args.log[0], 1);
                assert.notEqual(log.args.log[0][0].indexOf('INFO'), -1);
            });

            test('log.info was called correctly', function () {
                assert.strictEqual(
                    log.args.log[0][0].substr(log.args.log[0][0].indexOf('INFO')),
                    'INFO boomcatch: listening for 192.168.1.1:8080/foo/bar'
                );
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar',
                        method: 'POST',
                        headers: {
                            referer: 'foo.bar.baz.qux',
                            origin: 'http://bar',
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.args.setHeader[0][0], 'Access-Control-Allow-Origin');
                    assert.strictEqual(log.args.setHeader[0][1], 'http://bar');
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('log.info was called once', function () {
                    assert.strictEqual(log.counts.log, 2);
                    assert.lengthOf(log.args.log[1], 1);
                    assert.notEqual(log.args.log[1][0].indexOf('INFO'), -1);
                });

                test('log.info was called correctly', function () {
                    assert.strictEqual(
                        log.args.log[1][0].substr(log.args.log[1][0].indexOf('INFO')),
                        'INFO boomcatch: referer=foo.bar.baz.qux address=foo.bar[] method=POST url=/foo/bar'
                    );
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3d1');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.strictEqual(log.args.mapper[0][0].boomerang.load, 1);
                        });

                        test('forwarder was called once', function () {
                            assert.strictEqual(log.counts.forwarder, 1);
                        });

                        test('forwarder was called correctly', function () {
                            assert.strictEqual(log.args.forwarder[0][0], 'alternative mapped data');
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 0);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });
                    });
                });

                suite('receive too much body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3d10');
                    });

                    test('response.setHeader was called once', function () {
                        assert.strictEqual(log.counts.setHeader, 2);
                    });

                    test('response.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('response.end was called correctly', function () {
                        assert.strictEqual(log.args.end[0][0], '{ "error": "Body too large" }');
                    });

                    test('response.statusCode was set correctly', function () {
                        assert.strictEqual(response.statusCode, 413);
                    });

                    test('request.socket.destroy was called once', function () {
                        assert.strictEqual(log.counts.destroy, 1);
                    });
                });
            });

            suite('valid request without referer:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {},
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('invalid referer:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'foo.bar.bz.qux'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid referer `foo.bar.bz.qux`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 403);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 0);
                });
            });

            suite('immediately repeated request:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called three times', function () {
                    assert.strictEqual(log.counts.setHeader, 3);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Exceeded rate `1000`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('immediate request from different address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    request.socket.remoteAddress = 'wibble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('immediate request from different proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wobble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('immediate request from same proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called three times', function () {
                    assert.strictEqual(log.counts.setHeader, 3);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('immediate request from first proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called three times', function () {
                    assert.strictEqual(log.counts.setHeader, 3);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('immediate request first unproxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = null;
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('later repeated request', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    request.socket.remoteAddress = 'baz';
                    log.args.createServer[0][0](request, response);
                    request.socket.remoteAddress = 'foo.bar';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called four times', function () {
                    assert.strictEqual(log.counts.setHeader, 4);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('later request from same proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wobble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wubble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called five times', function () {
                    assert.strictEqual(log.counts.setHeader, 5);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 6);
                });
            });

            suite('invalid request:', function () {
                var request, response;

                setup(function () {
                    restrict = true;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'foo.bar.baz.qux'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.on[1][1]();
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid data" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 400);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });
            });
        });

        suite('call listen with failing mapper:', function () {
            setup(function () {
                boomcatch.listen({ mapper: 'failing' });
            });

            test('?.initialise was called three times', function () {
                assert.strictEqual(log.counts.initialise, 3);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./mappers/failing'));
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_done=1',
                        method: 'GET',
                        headers: {
                            referer: 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('forwarder was not called', function () {
                        assert.strictEqual(log.counts.forwarder, 0);
                    });

                    test('response.setHeader was called once', function () {
                        assert.strictEqual(log.counts.setHeader, 2);
                    });

                    test('response.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('response.end was called correctly', function () {
                        assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid data" }');
                    });

                    test('response.statusCode was set correctly', function () {
                        assert.strictEqual(response.statusCode, 400);
                    });

                    test('request.socket.destroy was called once', function () {
                        assert.strictEqual(log.counts.destroy, 1);
                    });
                });
            });
        });
    });
});

