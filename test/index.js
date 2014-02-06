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

suite('boomcatch:', function () {
    var log;

    setup(function () {
        log = {};
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('http', spooks.obj({
            archetype: { createServer: nop, listen: nop },
            log: log,
            chains: { createServer: true }
        }));
        mockery.registerMock('mappers/statsd', spooks.obj({
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
        mockery.registerMock('forwarders/udp', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'forwarder',
                    log: log
                })
            }
        }));
        mockery.registerMock('mapper', spooks.obj({
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
        mockery.registerMock('forwarder', spooks.obj({
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
        mockery.deregisterMock('forwarder');
        mockery.deregisterMock('mapper');
        mockery.deregisterMock('forwarders/udp');
        mockery.deregisterMock('mappers/statsd');
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: '',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: '',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                    log: function () {},
                    mapper: 'bar',
                    prefix: 'baz',
                    forwarder: 'qux',
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
                assert.strictEqual(log.these.initialise[0], require('mappers/statsd'));
                assert.lengthOf(log.args.initialise[0], 1);
                assert.isObject(log.args.initialise[0][0]);
                assert.isUndefined(log.args.initialise[0][0].prefix);
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('forwarders/udp'));
                assert.lengthOf(log.args.initialise[0], 1);
                assert.isObject(log.args.initialise[0][0]);
                assert.isUndefined(log.args.initialise[0][0].fwdHost);
                assert.isUndefined(log.args.initialise[0][0].fwdPort);
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
                        method: 'GET'
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

                test('udp.createSocket was not called', function () {
                    assert.strictEqual(log.counts.createSocket, 0);
                });

                test('socket.send was not called', function () {
                    assert.strictEqual(log.counts.send, 0);
                });
            });

            suite('invalid method:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=1&t_done=2',
                        method: 'POST'
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
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=1&t_done=2',
                        method: 'GET',
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
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

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
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

                    suite('end data:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('udp.createSocket was not called', function () {
                            assert.strictEqual(log.counts.createSocket, 0);
                        });

                        test('socket.send was not called', function () {
                            assert.strictEqual(log.counts.send, 0);
                        });

                        test('socket.close was not called', function () {
                            assert.strictEqual(log.counts.close, 0);
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 1);
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
                        assert.strictEqual(log.these.mapper[0], require('mappers/statsd').initialise());
                        assert.lengthOf(log.args.mapper[0], 1);
                        assert.isObject(log.args.mapper[0][0]);
                        assert.strictEqual(log.args.mapper[0][0].t_resp, 1);
                        assert.strictEqual(log.args.mapper[0][0].t_done, 2);
                        assert.isUndefined(log.args.mapper[0][0].nt_fet_st);
                        assert.isUndefined(log.args.mapper[0][0].nt_dns_end);
                        assert.isUndefined(log.args.mapper[0][0].nt_res_st);
                        assert.isUndefined(log.args.mapper[0][0].nt_domcontloaded_st);
                        assert.isUndefined(log.args.mapper[0][0].nt_load_st);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('forwarder was called correctly', function () {
                        assert.strictEqual(log.these.forwarder[0], require('forwarders/udp').initialise());
                        assert.lengthOf(log.args.forwarder[0], 2);
                        assert.instanceOf(log.args.forwarder[0][0], 'default mapped data');
                        assert.isFunction(log.args.forwarder[0][1]);
                    });

                    test('socket.close was not called', function () {
                        assert.strictEqual(log.counts.close, 0);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    suite('error:', function () {
                        setup(function () {
                            log.args.forwarder[0][1]('wibble');
                        });

                        test('socket.close was called once', function () {
                            assert.strictEqual(log.counts.close, 1);
                        });

                        test('socket.close was called correctly', function () {
                            assert.lengthOf(log.args.close[0], 0);
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
                    });

                    suite('success:', function () {
                        setup(function () {
                            log.args.forwarder[0][1](null, 1977);
                        });

                        test('socket.close was called once', function () {
                            assert.strictEqual(log.counts.close, 1);
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
                    });
                });
            });

            suite('invalid query string:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=1',
                        method: 'GET',
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
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
            });

            suite('request with navigation timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_resp=10&t_done=20&nt_fet_st=30&nt_dns_end=40&nt_res_st=50&nt_domcontloaded_st=60&nt_load_st=70',
                        method: 'GET',
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
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
                        assert.strictEqual(log.args.mapper[0][0].t_resp, 10);
                        assert.strictEqual(log.args.mapper[0][0].t_done, 20);
                        assert.strictEqual(log.args.mapper[0][0].nt_fet_st, 30);
                        assert.strictEqual(log.args.mapper[0][0].nt_dns_end, 40);
                        assert.strictEqual(log.args.mapper[0][0].nt_res_st, 50);
                        assert.strictEqual(log.args.mapper[0][0].nt_domcontloaded_st, 60);
                        assert.strictEqual(log.args.mapper[0][0].nt_load_st, 70);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('socket.close was not called', function () {
                        assert.strictEqual(log.counts.close, 0);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });
                });
            });
        });

        suite('call listen with custom options:', function () {
            setup(function () {
                boomcatch.listen({
                    host: '192.168.1.1',
                    port: 8080,
                    path: '/foo/bar',
                    log: spooks.fn({
                        name: 'log',
                        log: log
                    }),
                    mapper: 'mapper',
                    prefix: 'foo prefix',
                    forwarder: 'forwarder',
                    fwdHost: 'bar host',
                    fwdPort: 'baz port'
                });
            });

            test('?.initialise was called twice', function () {
                assert.strictEqual(log.counts.initialise, 2);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('mapper'));
                assert.strictEqual(log.args.initialise[0][0].prefix, 'foo prefix');
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('forwarder'));
                assert.strictEqual(log.args.initialise[0][0].fwdHost, 'bar host');
                assert.strictEqual(log.args.initialise[0][0].fwdPort, 'baz port');
            });

            test('http.listen was called correctly', function () {
                assert.strictEqual(log.args.listen[0][0], 8080);
                assert.strictEqual(log.args.listen[0][1], '192.168.1.1');
            });

            test('log was called once', function () {
                assert.strictEqual(log.counts.log, 1);
            });

            test('log was called correctly', function () {
                assert.lengthOf(log.args.log[0], 1);
                assert.strictEqual(log.args.log[0][0], 'boomcatch.listen: awaiting POST requests on 192.168.1.1:8080');
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/foo/bar?t_resp=100&t_done=200',
                        method: 'GET',
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
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
                        assert.strictEqual(log.these.mapper[0], require('mapper').initialise());
                        assert.strictEqual(log.args.mapper[0][0].t_resp, 100);
                        assert.strictEqual(log.args.mapper[0][0].t_done, 200);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('forwarder was called correctly', function () {
                        assert.strictEqual(log.these.forwarder[0], require('forwarder').initialise());
                        assert.instanceOf(log.args.forwarder[0][0], 'alternative mapped data');
                    });

                    test('socket.close was not called', function () {
                        assert.strictEqual(log.counts.close, 0);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });
                });
            });
        });
    });
});

