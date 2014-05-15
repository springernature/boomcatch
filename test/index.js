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
mockery.registerAllowable('fs');

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
        mockery.registerMock('./filters/unfiltered', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: function (data) {
                    log.counts.filter += 1;
                    log.args.filter.push(arguments);
                    log.these.filter.push(this);
                    return data;
                }
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
        mockery.registerMock('./filters/filtered', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'filter',
                    log: log,
                    result: {}
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
        mockery.deregisterMock('./filters/filtered');
        mockery.deregisterMock('./validators/restrictive');
        mockery.deregisterMock('./forwarders/udp');
        mockery.deregisterMock('./mappers/statsd');
        mockery.deregisterMock('./filters/unfiltered');
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
                });
            });
        });

        test('listen throws if filter is empty string', function () {
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
                    filter: '',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: '',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: '',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: '',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: '8125',
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
                });
            });
        });

        test('listen throws if fwdSize is string', function () {
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
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    log: {
                        info: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST'
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
                    filter: null,
                    mapper: null,
                    prefix: null,
                    forwarder: null,
                    fwdHost: null,
                    fwdPort: null,
                    fwdSize: null,
                    fwdUrl: null,
                    fwdMethod: null
                });
            });
        });

        suite('call listen with default options:', function () {
            setup(function () {
                boomcatch.listen();
            });

            test('?.initialise was called four times', function () {
                assert.strictEqual(log.counts.initialise, 4);
            });

            test('validator.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./validators/permissive'));
                assert.lengthOf(log.args.initialise[0], 1);
                assert.isObject(log.args.initialise[0][0]);
            });

            test('filter.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./filters/unfiltered'));
                assert.lengthOf(log.args.initialise[1], 1);
                assert.isObject(log.args.initialise[1][0]);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./mappers/statsd'));
                assert.lengthOf(log.args.initialise[2], 1);
                assert.isObject(log.args.initialise[2][0]);
                assert.isUndefined(log.args.initialise[2][0].prefix);
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[3], require('./forwarders/udp'));
                assert.lengthOf(log.args.initialise[3], 1);
                assert.isObject(log.args.initialise[3][0]);
                assert.isUndefined(log.args.initialise[3][0].fwdHost);
                assert.isUndefined(log.args.initialise[3][0].fwdPort);
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
                        url: '/foo?rt.tstart=1&t_resp=2&t_page=3&t_done=4&r=wibble',
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
                        url: '/beacon?rt.tstart=1&t_resp=2&t_page=3&t_done=4&r=wibble',
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                        url: '/beacon?rt.tstart=1&t_resp=2&t_page=3&t_done=4&r=wibble',
                        method: 'GET',
                        headers: {
                            referer: 'blah',
                            'user-agent': 'oovavu'
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
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isUndefined(log.these.mapper[0]);
                        assert.lengthOf(log.args.mapper[0], 4);
                        assert.isObject(log.args.mapper[0][0]);
                        assert.isObject(log.args.mapper[0][0].rt);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt), 4);
                        assert.strictEqual(log.args.mapper[0][0].rt.url, 'wibble');
                        assert.isObject(log.args.mapper[0][0].rt.timestamps);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt.timestamps), 1);
                        assert.strictEqual(log.args.mapper[0][0].rt.timestamps.start, 1);
                        assert.isObject(log.args.mapper[0][0].rt.events);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt.events), 0);
                        assert.isObject(log.args.mapper[0][0].rt.durations);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt.durations), 3);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.firstbyte, 2);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.lastbyte, 5);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 4);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isUndefined(log.args.mapper[0][0].restiming);
                        assert.strictEqual(log.args.mapper[0][1], 'blah');
                        assert.strictEqual(log.args.mapper[0][2], 'oovavu');
                        assert.strictEqual(log.args.mapper[0][3], 'foo.bar');
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
                            log.args.forwarder[0][2]('wibble');
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
                            log.args.forwarder[0][2](null, 1977);
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
                        url: '/beacon?rt.tstart=1&t_resp=2&t_page=3&r=wibble&nt_nav_st=10&nt_unload_st=20&nt_unload_end=30&nt_red_st=0&nt_red_end=0&nt_fet_st=40&nt_dns_st=50&nt_dns_end=60&nt_con_st=70&nt_con_end=80&nt_ssl_st=90&nt_req_st=100&nt_res_st=110&nt_res_end=120&nt_domloading=130&nt_domint=140&nt_domcontloaded_st=150&nt_domcontloaded_end=160&nt_domcomp=170&nt_load_st=180&nt_nav_type=foo&nt_red_cnt=0',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'abc',
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
                    assert.isUndefined(log.args.mapper[0][0].rt);
                    assert.isUndefined(log.args.mapper[0][0].navtiming);
                    assert.isUndefined(log.args.mapper[0][0].restiming);
                    assert.strictEqual(log.args.mapper[0][1], 'wibble');
                    assert.strictEqual(log.args.mapper[0][2], 'blah');
                    assert.strictEqual(log.args.mapper[0][3], 'abc');
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
                        url: '/beacon?nt_nav_st=10&nt_unload_st=20&nt_unload_end=30&nt_red_st=0&nt_red_end=0&nt_fet_st=40&nt_dns_st=50&nt_dns_end=60&nt_con_st=70&nt_con_end=80&nt_ssl_st=90&nt_req_st=100&nt_res_st=110&nt_res_end=120&nt_domloading=130&nt_domint=140&nt_domcontloaded_st=150&nt_domcontloaded_end=160&nt_domcomp=170&nt_load_st=180&nt_load_end=190&nt_nav_type=foo&nt_red_cnt=0',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
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
                        assert.isUndefined(log.args.mapper[0][0].rt);

                        assert.isObject(log.args.mapper[0][0].navtiming);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming), 4);

                        assert.strictEqual(log.args.mapper[0][0].navtiming.type, 'foo');

                        assert.isObject(log.args.mapper[0][0].navtiming.timestamps);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.timestamps), 5);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.start, 10);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.fetchStart, 40);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.sslStart, 90);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.requestStart, 100);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.domInteractive, 140);

                        assert.isObject(log.args.mapper[0][0].navtiming.events);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.events), 8);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.unload);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.events.unload), 2);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.unload.start, 20);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.unload.end, 30);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.redirect);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.redirect.start, 0);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.redirect.end, 0);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.dns);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dns.start, 50);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dns.end, 60);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.connect);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.connect.start, 70);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.connect.end, 80);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.response);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.response.start, 110);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.response.end, 120);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.dom);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dom.start, 130);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dom.end, 170);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.domContent);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.domContent.start, 150);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.domContent.end, 160);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.load);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.load.start, 180);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.load.end, 190);

                        assert.isObject(log.args.mapper[0][0].navtiming.durations);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.durations), 0);

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
                        url: '/beacon?restiming%5B0%5D%5Brt_name%5D=foo&restiming%5B0%5D%5Brt_in_type%5D=css&restiming%5B0%5D%5Brt_st%5D=30&restiming%5B0%5D%5Brt_dur%5D=40&restiming%5B0%5D%5Brt_red_st%5D=50&restiming%5B0%5D%5Brt_red_end%5D=60&restiming%5B0%5D%5Brt_fet_st%5D=70&restiming%5B0%5D%5Brt_dns_st%5D=80&restiming%5B0%5D%5Brt_dns_end%5D=90&restiming%5B0%5D%5Brt_con_st%5D=100&restiming%5B0%5D%5Brt_con_end%5D=110&restiming%5B0%5D%5Brt_scon_st%5D=120&restiming%5B0%5D%5Brt_req_st%5D=130&restiming%5B0%5D%5Brt_res_st%5D=140&restiming%5B0%5D%5Brt_res_end%5D=150&restiming%5B1%5D%5Brt_name%5D=bar&restiming%5B1%5D%5Brt_in_type%5D=img&restiming%5B1%5D%5Brt_st%5D=160&restiming%5B1%5D%5Brt_dur%5D=170&restiming%5B1%5D%5Brt_red_st%5D=180&restiming%5B1%5D%5Brt_red_end%5D=190&restiming%5B1%5D%5Brt_fet_st%5D=200&restiming%5B1%5D%5Brt_dns_st%5D=210&restiming%5B1%5D%5Brt_dns_end%5D=220&restiming%5B1%5D%5Brt_con_st%5D=230&restiming%5B1%5D%5Brt_con_end%5D=240&restiming%5B1%5D%5Brt_scon_st%5D=250&restiming%5B1%5D%5Brt_req_st%5D=260&restiming%5B1%5D%5Brt_res_st%5D=270&restiming%5B1%5D%5Brt_res_end%5D=280',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
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
                        assert.isUndefined(log.args.mapper[0][0].rt);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isArray(log.args.mapper[0][0].restiming);
                        assert.lengthOf(log.args.mapper[0][0].restiming, 2);

                        assert.isObject(log.args.mapper[0][0].restiming[0]);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0]), 5);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].name, 'foo');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].type, 'css');
                        assert.isObject(log.args.mapper[0][0].restiming[0].timestamps);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].timestamps), 4);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.start, 30);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.fetchStart, 70);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.sslStart, 120);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.requestStart, 130);
                        assert.isObject(log.args.mapper[0][0].restiming[0].events);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].events), 4);
                        assert.isObject(log.args.mapper[0][0].restiming[0].events.redirect);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].events.redirect), 2);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.redirect.start, 50);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.redirect.end, 60);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.dns.start, 80);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.dns.end, 90);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.connect.start, 100);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.connect.end, 110);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.response.start, 140);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.response.end, 150);
                        assert.isObject(log.args.mapper[0][0].restiming[0].durations);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].durations), 0);

                        assert.strictEqual(log.args.mapper[0][0].restiming[1].name, 'bar');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].type, 'img');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.start, 160);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.fetchStart, 200);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.sslStart, 250);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.requestStart, 260);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.redirect.start, 180);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.redirect.end, 190);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.dns.start, 210);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.dns.end, 220);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.connect.start, 230);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.connect.end, 240);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.response.start, 270);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.response.end, 280);
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
                        url: '/beacon?restiming%5B0%5D%5Brt_name%5D=foo&restiming%5B0%5D%5Brt_in_type%5D=css&restiming%5B0%5D%5Brt_st%5D=20&restiming%5B0%5D%5Brt_dur%5D=30&restiming%5B0%5D%5Brt_fet_st%5D=40&restiming%5B0%5D%5Brt_req_st%5D=50&restiming%5B0%5D%5Brt_res_end%5D=60&restiming%5B1%5D%5Brt_name%5D=bar&restiming%5B1%5D%5Brt_in_type%5D=img&restiming%5B1%5D%5Brt_st%5D=70&restiming%5B1%5D%5Brt_dur%5D=80&restiming%5B1%5D%5Brt_fet_st%5D=90&restiming%5B1%5D%5Brt_req_st%5D=100&restiming%5B1%5D%5Brt_res_end%5D=110',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
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
                        assert.isArray(log.args.mapper[0][0].restiming);
                        assert.lengthOf(log.args.mapper[0][0].restiming, 2);

                        assert.strictEqual(log.args.mapper[0][0].restiming[0].name, 'foo');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].type, 'css');
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].timestamps), 3);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.start, 20);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.fetchStart, 40);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.requestStart, 50);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].events), 0);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].durations), 0);

                        assert.strictEqual(log.args.mapper[0][0].restiming[1].name, 'bar');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].type, 'img');
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[1].timestamps), 3);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.start, 70);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.fetchStart, 90);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.requestStart, 100);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[1].events), 0);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[1].durations), 0);
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
                            'content-type': 'application/x-www-form-urlencoded',
                            'user-agent': 'blah'
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
                        log.args.on[0][1]('data=t_done%3d1%26r%3Dfoo');
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
                            assert.isObject(log.args.mapper[0][0].rt);
                            assert.strictEqual(log.args.mapper[0][0].rt.url, 'foo');
                            assert.isUndefined(log.args.mapper[0][0].rt.timestamps.start);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.firstbyte);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.lastbyte);
                            assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 1);
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
                                log.args.forwarder[0][2](null, 1);
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
                        log.args.on[0][1]('data=%7B%22t_done%22%3A10%2C%22r%22%3A%22foo%22%7D');
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
                            assert.isUndefined(log.args.mapper[0][0].rt);
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
                            'content-type': 'text/plain',
                            'user-agent': 'blah'
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
                        log.args.on[0][1]('data=%7B%22t_done%22%3A10%2C%22r%22%3A%22bar%22%7D');
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
                            assert.isObject(log.args.mapper[0][0].rt);
                            assert.strictEqual(log.args.mapper[0][0].rt.url, 'bar');
                            assert.isUndefined(log.args.mapper[0][0].rt.timestamps.start);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.firstbyte);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.lastbyte);
                            assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 10);
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

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
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
                    maxSize: 30,
                    log: {
                        info: spooks.fn({
                            name: 'info',
                            log: log
                        }),
                        error: spooks.fn({
                            name: 'error',
                            log: log
                        })
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'foo prefix',
                    forwarder: 'forwarder',
                    fwdHost: 'bar host',
                    fwdPort: 1234,
                    fwdSize: 256
                });
            });

            test('?.initialise was called four times', function () {
                assert.strictEqual(log.counts.initialise, 4);
            });

            test('validator.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./validators/restrictive'));
                assert.isObject(log.args.initialise[0][0]);
            });

            test('filter.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./filters/filtered'));
                assert.isObject(log.args.initialise[1][0]);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./mappers/mapper'));
                assert.strictEqual(log.args.initialise[2][0].prefix, 'foo prefix');
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[3], require('./forwarders/forwarder'));
                assert.strictEqual(log.args.initialise[3][0].fwdHost, 'bar host');
                assert.strictEqual(log.args.initialise[3][0].fwdPort, 1234);
            });

            test('http.listen was called correctly', function () {
                assert.strictEqual(log.args.listen[0][0], 8080);
                assert.strictEqual(log.args.listen[0][1], '192.168.1.1');
            });

            test('log.info was called once', function () {
                assert.strictEqual(log.counts.info, 1);
            });

            test('log.info was called correctly', function () {
                assert.lengthOf(log.args.info[0], 1);
                assert.strictEqual(log.args.info[0][0], 'listening for 192.168.1.1:8080/foo/bar');
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
                    assert.strictEqual(log.counts.info, 2);
                });

                test('log.info was called correctly', function () {
                    assert.strictEqual(log.args.info[1][0], 'referer=foo.bar.baz.qux address=foo.bar[] method=POST url=/foo/bar');
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3D100%26r%3D');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('validator was called once', function () {
                            assert.strictEqual(log.counts.validator, 1);
                        });

                        test('validator was called correctly', function () {
                            assert.isObject(log.args.validator[0][0]);
                            assert.lengthOf(Object.keys(log.args.validator[0][0]), 2);
                            assert.strictEqual(log.args.validator[0][0].r, '');
                            assert.strictEqual(log.args.validator[0][0].t_done, '100');
                        });

                        test('filter was called once', function () {
                            assert.strictEqual(log.counts.filter, 1);
                        });

                        test('filter was called correctly', function () {
                            assert.isObject(log.args.filter[0][0]);
                            assert.isObject(log.args.filter[0][0].rt);
                            assert.strictEqual(log.args.filter[0][0].rt.url, '');
                            assert.strictEqual(log.args.filter[0][0].rt.durations.load, 100);
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isObject(log.args.mapper[0][0]);
                            assert.lengthOf(Object.keys(log.args.mapper[0][0]), 0);
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
                        log.args.on[0][1]('data=t_done%3D100%26r%3Dwibbley');
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

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
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

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
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

            suite('immediate request from first unproxied address:', function () {
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

            test('?.initialise was called four times', function () {
                assert.strictEqual(log.counts.initialise, 4);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./mappers/failing'));
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

