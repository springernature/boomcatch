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

var assert, mockery, spooks, modulePath, nop;

assert = require('chai').assert;
mockery = require('mockery');
spooks = require('spooks');

modulePath = '../src';

nop = function () {};

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('querystring');
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
    });

    teardown(function () {
        mockery.deregisterMock('./forwarders/forwarder');
        mockery.deregisterMock('./mappers/mapper');
        mockery.deregisterMock('./forwarders/udp');
        mockery.deregisterMock('./mappers/statsd');
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: '100',
                    log: function () {},
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
                    limit: 100,
                    log: {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: 100,
                    log: function () {},
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
                    limit: null,
                    log: null,
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

            test('?.initialise was called twice', function () {
                assert.strictEqual(log.counts.initialise, 2);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./mappers/statsd'));
                assert.lengthOf(log.args.initialise[0], 1);
                assert.isObject(log.args.initialise[0][0]);
                assert.isUndefined(log.args.initialise[0][0].prefix);
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./forwarders/udp'));
                assert.lengthOf(log.args.initialise[1], 1);
                assert.isObject(log.args.initialise[1][0]);
                assert.isUndefined(log.args.initialise[1][0].fwdHost);
                assert.isUndefined(log.args.initialise[1][0].fwdPort);
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
                        url: '/foo?t_resp=1&t_done=2',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.these.setHeader[0], response);
                    assert.lengthOf(log.args.setHeader[0], 2);
                    assert.strictEqual(log.args.setHeader[0][0], 'Content-Type');
                    assert.strictEqual(log.args.setHeader[0][1], 'application/json');
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
                        url: '/beacon?t_resp=1&t_done=2',
                        method: 'POST',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.args.setHeader[0][0], 'Content-Type');
                    assert.strictEqual(log.args.setHeader[0][1], 'application/json');
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid method `POST`" }');
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
                        url: '/beacon?t_resp=1&t_done=2',
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

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    test('response.setHeader was called correctly', function () {
                        assert.strictEqual(log.args.setHeader[0][0], 'Content-Type');
                        assert.strictEqual(log.args.setHeader[0][1], 'application/json');
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

                    suite('end data:', function () {
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

                suite('end data:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isUndefined(log.these.mapper[0]);
                        assert.lengthOf(log.args.mapper[0], 1);
                        assert.isObject(log.args.mapper[0][0]);
                        assert.isObject(log.args.mapper[0][0].boomerang);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.firstbyte, 1);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.load, 2);
                        assert.isUndefined(log.args.mapper[0][0].ntapi);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('forwarder was called correctly', function () {
                        assert.isUndefined(log.these.forwarder[0]);
                        assert.lengthOf(log.args.forwarder[0], 2);
                        assert.strictEqual(log.args.forwarder[0][0], 'default mapped data');
                        assert.isFunction(log.args.forwarder[0][1]);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    suite('error:', function () {
                        setup(function () {
                            log.args.forwarder[0][1]('wibble');
                        });

                        test('response.setHeader was called once', function () {
                            assert.strictEqual(log.counts.setHeader, 1);
                        });

                        test('response.setHeader was called correctly', function () {
                            assert.strictEqual(log.args.setHeader[0][0], 'Content-Type');
                            assert.strictEqual(log.args.setHeader[0][1], 'application/json');
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
                            assert.strictEqual(log.counts.setHeader, 0);
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
                        url: '/beacon?t_resp=1',
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
                    log.args.on[1][1]();
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.args.setHeader[0][0], 'Content-Type');
                    assert.strictEqual(log.args.setHeader[0][1], 'application/json');
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

            suite('request with navigation timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=10&t_done=20&nt_fet_st=30&nt_dns_end=40&nt_res_st=50&nt_domcontloaded_st=60&nt_load_st=70',
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
                    assert.strictEqual(log.counts.setHeader, 0);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end data:', function () {
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
                        assert.isObject(log.args.mapper[0][0].ntapi);
                        assert.strictEqual(log.args.mapper[0][0].ntapi.dns, 10);
                        assert.strictEqual(log.args.mapper[0][0].ntapi.firstbyte, 20);
                        assert.strictEqual(log.args.mapper[0][0].ntapi.domload, 30);
                        assert.strictEqual(log.args.mapper[0][0].ntapi.load, 40);
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

            suite('immediately repeated request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=1&t_done=2',
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

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                    limit: 1000,
                    log: spooks.fn({
                        name: 'log',
                        log: log
                    }),
                    mapper: 'mapper',
                    prefix: 'foo prefix',
                    forwarder: 'forwarder',
                    fwdHost: 'bar host',
                    fwdPort: 1234
                });
            });

            test('?.initialise was called twice', function () {
                assert.strictEqual(log.counts.initialise, 2);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./mappers/mapper'));
                assert.strictEqual(log.args.initialise[0][0].prefix, 'foo prefix');
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./forwarders/forwarder'));
                assert.strictEqual(log.args.initialise[1][0].fwdHost, 'bar host');
                assert.strictEqual(log.args.initialise[1][0].fwdPort, 1234);
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
                    'INFO boomcatch: listening for GET 192.168.1.1:8080/foo/bar'
                );
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                        'INFO boomcatch: referer=foo.bar.baz.qux address=foo.bar[] method=GET url=/foo/bar?t_resp=100&t_done=200'
                    );
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end data:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.strictEqual(log.args.mapper[0][0].boomerang.firstbyte, 100);
                        assert.strictEqual(log.args.mapper[0][0].boomerang.load, 200);
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
                });
            });

            suite('valid request without referer:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 0);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
        });
    });
});

