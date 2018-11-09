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

var assert, mockery, spooks, modulePath, nop;

assert = require('chai').assert;
mockery = require('mockery');
spooks = require('spooks');

modulePath = '../src';

nop = function () {};

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('qs');
mockery.registerAllowable('./lib/');
mockery.registerAllowable('./stringify');
mockery.registerAllowable('./utils');
mockery.registerAllowable('./parse');
mockery.registerAllowable('./v1');
mockery.registerAllowable('./v4');
mockery.registerAllowable('./lib/rng');
mockery.registerAllowable('./lib/bytesToUuid');
mockery.registerAllowable('./formats');

process.setMaxListeners(500);

suite('index:', function () {
    var log, results, restrict, cluster, isTooBusy;

    setup(function () {
        log = {};
        results = {
            existsSync: [],
            statSync: [],
            readFileSync: []
        };
        cluster = spooks.obj({
            archetype: { fork: nop, on: nop },
            log: log
        });
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('http', spooks.obj({
            archetype: { createServer: nop, listen: nop },
            log: log,
            chains: { createServer: true }
        }));
        mockery.registerMock('https', spooks.obj({
            archetype: { options: {}, createServer: nop, listen: nop },
            log: log,
            chains: { createServer: true }
        }));
        mockery.registerMock('fs', spooks.obj({
            archetype: { existsSync: nop, statSync: nop, readFileSync: nop },
            log: log,
            results: results
        }));
        mockery.registerMock('./validators/permissive', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'validator',
                        log: log,
                        results: [ true ]
                    })
                ]
            }
        }));
        mockery.registerMock('./filters/unfiltered', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    function (data) {
                        log.counts.filter += 1;
                        log.args.filter.push(arguments);
                        log.these.filter.push(this);
                        return data;
                    }
                ]
            }
        }));
        mockery.registerMock('./mappers/statsd', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'mapper',
                        log: log,
                        results: [ 'default mapped data' ]
                    })
                ]
            }
        }));
        mockery.registerMock('./forwarders/udp', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'forwarder',
                        log: log
                    })
                ]
            }
        }));
        mockery.registerMock('./validators/restrictive', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    function () {
                        log.counts.validator += 1;
                        log.these.validator.push(this);
                        log.args.validator.push(arguments);
                        return !restrict;
                    }
                ]
            }
        }));
        mockery.registerMock('./filters/filtered', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'filter',
                        log: log,
                        results: [ {} ]
                    })
                ]
            }
        }));
        mockery.registerMock('./mappers/mapper', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'mapper',
                        log: log,
                        results: [ 'alternative mapped data' ]
                    })
                ]
            }
        }));
        mockery.registerMock('./forwarders/forwarder', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'forwarder',
                        log: log
                    })
                ]
            }
        }));
        mockery.registerMock('./mappers/failing', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: [
                    spooks.fn({
                        name: 'mapper',
                        log: log,
                        results: [ '' ]
                    })
                ]
            }
        }));
        mockery.registerMock('toobusy-js', function () {
            log.counts.toobusy += 1;
            log.these.toobusy.push(this);
            log.args.toobusy.push(arguments);
        });
        log.counts.toobusy = 0;
        log.these.toobusy = [];
        log.args.toobusy = [];
        mockery.registerMock('cluster', cluster);
    });

    teardown(function () {
        mockery.deregisterMock('cluster');
        mockery.deregisterMock('toobusy-js');
        mockery.deregisterMock('./mappers/failing');
        mockery.deregisterMock('./forwarders/forwarder');
        mockery.deregisterMock('./mappers/mapper');
        mockery.deregisterMock('./filters/filtered');
        mockery.deregisterMock('./validators/restrictive');
        mockery.deregisterMock('./forwarders/udp');
        mockery.deregisterMock('./mappers/statsd');
        mockery.deregisterMock('./filters/unfiltered');
        mockery.deregisterMock('./validators/permissive');
        mockery.deregisterMock('fs');
        mockery.deregisterMock('https');
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if log.info is not function', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if log.warn is not function', function () {
            assert.throws(function () {
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
                        warn: {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if log.error is not function', function () {
            assert.throws(function () {
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
                        warn: function () {},
                        error: {}
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: '',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: '',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: '',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: '',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: '',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: '8125',
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    log: {
                        info: function () {},
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if workers is string', function () {
            assert.throws(function () {
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
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: '4',
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if workers is negative number', function () {
            assert.throws(function () {
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
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: -1,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if delayRespawn is string', function () {
            assert.throws(function () {
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
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: '200',
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if delayRespawn is negative number', function () {
            assert.throws(function () {
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
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: -1,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if maxRespawn is string', function () {
            assert.throws(function () {
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
                        warn: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: '-1'
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
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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
                    fwdMethod: null,
                    workers: null,
                    delayRespawn: null,
                    maxRespawn: null
                });
            });
        });

        test('listen throws if HTTPS PFX is not a string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsPfx: { toString: function () { return 'wibble' } },
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen does not throw if HTTPS PFX is string', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsPfx: 'wibble',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if HTTPS private key path is not a string', function () {
            results.existsSync[0] = true;
            results.statSync[0] = { isFile: function () { return true; } };

            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsKey: { toString: function () { return 'wibble' } },
                    httpsCert: 'wobble',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if HTTPS certificate path is not a string', function () {
            results.existsSync[0] = true;
            results.statSync[0] = { isFile: function () { return true; } };

            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsKey: 'wibble',
                    httpsCert: { toString: function () { return 'wobble' } },
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if HTTPS private key path is not found', function () {
            results.existsSync[0] = false;
            results.existsSync[1] = true;
            results.statSync[0] = { isFile: function () { return true; } };

            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsKey: 'wibble',
                    httpsCert: 'wobble',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen throws if HTTPS certificate path is not found', function () {
            results.existsSync[0] = true;
            results.statSync[0] = { isFile: function () { return true; } };
            results.statSync[1] = { isFile: function () { return false; } };

            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsKey: 'wibble',
                    httpsCert: 'wobble',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
                });
            });
        });

        test('listen does not throw if HTTPS private key and certificate paths are found', function () {
            results.existsSync[0] = true;
            results.statSync[0] = { isFile: function () { return true; } };

            assert.doesNotThrow(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    https: true,
                    httpsKey: 'wibble',
                    httpsCert: 'wobble',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        warn: function () {},
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
                    fwdMethod: 'POST',
                    workers: 2,
                    delayRespawn: 100,
                    maxRespawn: -1
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

            test('cluster.fork was not called', function () {
                assert.strictEqual(log.counts.fork, 0);
            });

            test('cluster.on was not called', function () {
                assert.strictEqual(log.counts.on, 0);
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
                        assert.lengthOf(Object.keys(log.args.mapper[0][0]), 5);
                        assert.isObject(log.args.mapper[0][0].rt);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt), 1);
                        assert.strictEqual(log.args.mapper[0][0].rt.tstart, '1');
                        assert.strictEqual(log.args.mapper[0][0].t_resp, '2');
                        assert.strictEqual(log.args.mapper[0][0].t_page, '3');
                        assert.strictEqual(log.args.mapper[0][0].t_done, '4');
                        assert.strictEqual(log.args.mapper[0][0].r, 'wibble');
                        assert.strictEqual(log.args.mapper[0][1], 'blah');
                        assert.strictEqual(log.args.mapper[0][2], 'oovavu');
                        assert.strictEqual(log.args.mapper[0][3], 'foo.bar');
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('forwarder was called correctly', function () {
                        assert.isUndefined(log.these.forwarder[0]);
                        assert.lengthOf(log.args.forwarder[0], 4);
                        assert.strictEqual(log.args.forwarder[0][0], 'default mapped data');
                        assert.isUndefined(log.args.forwarder[0][1]);
                        assert.isUndefined(log.args.forwarder[0][2]);
                        assert.isFunction(log.args.forwarder[0][3]);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    suite('error:', function () {
                        setup(function () {
                            log.args.forwarder[0][3]('wibble');
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
                            assert.strictEqual(log.args.end[0][0], '{ "error": "Forwarder failed" }');
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
                            log.args.forwarder[0][3](null, 1977);
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
                            assert.isObject(log.args.mapper[0][0]);
                            assert.lengthOf(Object.keys(log.args.mapper[0][0]), 2);
                            assert.strictEqual(log.args.mapper[0][0].t_done, '1');
                            assert.strictEqual(log.args.mapper[0][0].r, 'foo');
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
                                log.args.forwarder[0][3](null, 1);
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
                            assert.isObject(log.args.mapper[0][0]);
                            assert.lengthOf(Object.keys(log.args.mapper[0][0]), 2);
                            assert.strictEqual(log.args.mapper[0][0].t_done, 10);
                            assert.strictEqual(log.args.mapper[0][0].r, 'bar');
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
                        warn: spooks.fn({
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
                    fwdSize: 256,
                    workers: 2
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

            test('cluster.fork was not called', function () {
                assert.strictEqual(log.counts.fork, 0);
            });

            test('cluster.on was not called', function () {
                assert.strictEqual(log.counts.on, 0);
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
                            'content-type': 'application/x-www-form-urlencoded',
                            'user-agent': 'wibble'
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
                    assert.strictEqual(log.args.info[1][0], 'referer=foo.bar.baz.qux user-agent=wibble address=foo.bar[] method=POST url=/foo/bar');
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
                            assert.lengthOf(Object.keys(log.args.filter[0][0]), 2);
                            assert.strictEqual(log.args.filter[0][0].t_done, '100');
                            assert.strictEqual(log.args.filter[0][0].r, '');
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

        suite('call listen with HTTPS PFX options:', function () {
            setup(function () {
                boomcatch.listen({
                    https: true,
                    httpsPfx: 'foo foo pfx foo',
                    httpsPass: 'passphrase bar'
                });
            });

            test('https.createServer was called once', function () {
                assert.strictEqual(log.counts.createServer, 1);
                assert.strictEqual(log.these.createServer[0], require('https'));
            });

            test('https.createServer was called correctly', function () {
                assert.lengthOf(log.args.createServer[0], 2);
                assert.isObject(log.args.createServer[0][0]);
                assert.lengthOf(Object.keys(log.args.createServer[0][0]), 4);
                assert.strictEqual(log.args.createServer[0][0].pfx, 'foo foo pfx foo');
                assert.strictEqual(log.args.createServer[0][0].passphrase, 'passphrase bar');
                assert.strictEqual(log.args.createServer[0][0].ciphers, 'ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA');
                assert.isTrue(log.args.createServer[0][0].honorCipherOrder);
                assert.isFunction(log.args.createServer[0][1]);
            });

            test('https.listen was called once', function () {
                assert.strictEqual(log.counts.listen, 1);
                assert.strictEqual(log.these.listen[0], require('https'));
            });

            test('https.listen was called correctly', function () {
                assert.lengthOf(log.args.listen[0], 2);
                assert.strictEqual(log.args.listen[0][0], 443);
                assert.strictEqual(log.args.listen[0][1], '0.0.0.0');
            });
        });

        suite('call listen with HTTPS key/cert options:', function () {
            setup(function () {
                results.existsSync[0] = true;
                results.statSync[0] = { isFile: function () { return true; } };
                results.readFileSync[0] = 'first result from readFileSync';
                results.readFileSync[1] = 'readFileSync second result';

                boomcatch.listen({
                    host: 'boomcatch.local',
                    port: 8008,
                    https: true,
                    httpsKey: 'key foo',
                    httpsCert: 'cert bar',
                    httpsPass: 'baz passphrase'
                });
            });

            test('fs.existsSync was called twice', function () {
                assert.strictEqual(log.counts.existsSync, 2);
                assert.strictEqual(log.these.existsSync[0], require('fs'));
                assert.strictEqual(log.these.existsSync[1], require('fs'));
            });

            test('fs.existsSync was called correctly first time', function () {
                assert.lengthOf(log.args.existsSync[0], 1);
                assert.strictEqual(log.args.existsSync[0][0], 'key foo');
            });

            test('fs.existsSync was called correctly second time', function () {
                assert.lengthOf(log.args.existsSync[1], 1);
                assert.strictEqual(log.args.existsSync[1][0], 'cert bar');
            });

            test('fs.statSync was called twice', function () {
                assert.strictEqual(log.counts.statSync, 2);
                assert.strictEqual(log.these.statSync[0], require('fs'));
                assert.strictEqual(log.these.statSync[1], require('fs'));
            });

            test('fs.statSync was called correctly first time', function () {
                assert.lengthOf(log.args.statSync[0], 1);
                assert.strictEqual(log.args.statSync[0][0], 'key foo');
            });

            test('fs.statSync was called correctly second time', function () {
                assert.lengthOf(log.args.statSync[1], 1);
                assert.strictEqual(log.args.statSync[1][0], 'cert bar');
            });

            test('https.createServer was called once', function () {
                assert.strictEqual(log.counts.createServer, 1);
                assert.strictEqual(log.these.createServer[0], require('https'));
            });

            test('https.createServer was called correctly', function () {
                assert.lengthOf(log.args.createServer[0], 2);
                assert.isObject(log.args.createServer[0][0]);
                assert.lengthOf(Object.keys(log.args.createServer[0][0]), 5);
                assert.strictEqual(log.args.createServer[0][0].key, 'first result from readFileSync');
                assert.strictEqual(log.args.createServer[0][0].cert, 'readFileSync second result');
                assert.strictEqual(log.args.createServer[0][0].passphrase, 'baz passphrase');
                assert.strictEqual(log.args.createServer[0][0].ciphers, 'ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA');
                assert.isTrue(log.args.createServer[0][0].honorCipherOrder);
                assert.isFunction(log.args.createServer[0][1]);
            });

            test('https.listen was called once', function () {
                assert.strictEqual(log.counts.listen, 1);
                assert.strictEqual(log.these.listen[0], require('https'));
            });

            test('https.listen was called correctly', function () {
                assert.lengthOf(log.args.listen[0], 2);
                assert.strictEqual(log.args.listen[0][0], 8008);
                assert.strictEqual(log.args.listen[0][1], 'boomcatch.local');
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

        suite('call listen with cluster master:', function () {
            setup(function () {
                cluster.isMaster = true;

                boomcatch.listen({
                    log: {
                        info: spooks.fn({
                            name: 'info',
                            log: log
                        }),
                        warn: spooks.fn({
                            name: 'warn',
                            log: log
                        }),
                        error: spooks.fn({
                            name: 'error',
                            log: log
                        })
                    },
                    workers: 2,
                    delayRespawn: 10,
                    maxRespawn: 2
                });
            });

            teardown(function () {
                cluster.isMaster = undefined;
            });

            test('?.initialise was not called', function () {
                assert.strictEqual(log.counts.initialise, 0);
            });

            test('http.createServer was not called', function () {
                assert.strictEqual(log.counts.createServer, 0);
            });

            test('http.listen was not called', function () {
                assert.strictEqual(log.counts.listen, 0);
            });

            test('cluster.fork was called twice', function () {
                assert.strictEqual(log.counts.fork, 2);
            });

            test('cluster.fork was called correctly first time', function () {
                assert.strictEqual(log.these.fork[0], cluster);
                assert.lengthOf(log.args.fork[0], 0);
            });

            test('cluster.fork was called correctly second time', function () {
                assert.strictEqual(log.these.fork[1], cluster);
                assert.lengthOf(log.args.fork[1], 0);
            });

            test('cluster.on was called twice', function () {
                assert.strictEqual(log.counts.on, 2);
            });

            test('cluster.on was called correctly first time', function () {
                assert.strictEqual(log.these.on[0], cluster);
                assert.lengthOf(log.args.on[0], 2);
                assert.strictEqual(log.args.on[0][0], 'online');
                assert.isFunction(log.args.on[0][1]);
            });

            test('cluster.on was called correctly second time', function () {
                assert.strictEqual(log.these.on[1], cluster);
                assert.lengthOf(log.args.on[1], 2);
                assert.strictEqual(log.args.on[1][0], 'exit');
                assert.isFunction(log.args.on[1][1]);
                assert.notEqual(log.args.on[0][1], log.args.on[1][1]);
            });

            test('log.info was called once', function () {
                assert.strictEqual(log.counts.info, 1);
            });

            test('log.warn was not called', function () {
                assert.strictEqual(log.counts.warn, 0);
            });

            test('log.error was not called', function () {
                assert.strictEqual(log.counts.error, 0);
            });

            suite('kill worker:', function () {
                var worker;

                setup(function (done) {
                    worker = {
                        process: {
                            pid: 19770610
                        }
                    };
                    log.args.on[1][1](worker, 77);
                    setTimeout(done, 20);
                });

                teardown(function () {
                    worker = undefined;
                });

                test('log.warn was called once', function () {
                    assert.strictEqual(log.counts.warn, 1);
                });

                test('log.warn was called correctly', function () {
                    assert.lengthOf(log.args.warn[0], 1);
                    assert.strictEqual(log.args.warn[0][0], 'worker 19770610 died (code 77), respawning');
                });

                test('cluster.fork was called once', function () {
                    assert.strictEqual(log.counts.fork, 3);
                });

                test('cluster.fork was called correctly', function () {
                    assert.strictEqual(log.these.fork[2], cluster);
                    assert.lengthOf(log.args.fork[2], 0);
                });

                suite('kill worker:', function () {
                    var worker;

                    setup(function (done) {
                        worker = {
                            process: {
                                pid: 'foo'
                            }
                        };
                        log.args.on[1][1](worker, undefined, 'bar');
                        setTimeout(done, 20);
                    });

                    teardown(function () {
                        worker = undefined;
                    });

                    test('log.warn was called once', function () {
                        assert.strictEqual(log.counts.warn, 2);
                    });

                    test('log.warn was called correctly', function () {
                        assert.lengthOf(log.args.warn[1], 1);
                        assert.strictEqual(log.args.warn[1][0], 'worker foo died (signal bar), respawning');
                    });

                    test('cluster.fork was called once', function () {
                        assert.strictEqual(log.counts.fork, 4);
                    });

                    test('log.error was not called', function () {
                        assert.strictEqual(log.counts.error, 0);
                    });

                    suite('kill worker:', function () {
                        var worker;

                        setup(function (done) {
                            worker = {
                                process: {
                                    pid: 'wibble'
                                }
                            };
                            log.args.on[1][1](worker, undefined, 'woo');
                            setTimeout(done, 20);
                        });

                        teardown(function () {
                            worker = undefined;
                        });

                        test('log.warn was not called', function () {
                            assert.strictEqual(log.counts.warn, 2);
                        });

                        test('log.error was called once', function () {
                            assert.strictEqual(log.counts.error, 1);
                        });

                        test('log.error was called correctly', function () {
                            assert.lengthOf(log.args.error[0], 1);
                            assert.strictEqual(log.args.error[0][0], 'exceeded respawn limit, worker wibble died (signal woo)');
                        });

                        test('cluster.fork was not called', function () {
                            assert.strictEqual(log.counts.fork, 4);
                        });
                    });
                });
            });

            suite('exit worker:', function () {
                var worker;

                setup(function () {
                    worker = {
                        process: {
                            pid: 1
                        },
                        exitedAfterDisconnect: true
                    };
                    log.args.on[1][1](worker, null, 3);
                });

                teardown(function () {
                    worker = undefined;
                });

                test('log.info was called once', function () {
                    assert.strictEqual(log.counts.info, 2);
                });

                test('log.info was called correctly', function () {
                    assert.lengthOf(log.args.info[1], 1);
                    assert.strictEqual(log.args.info[1][0], 'worker 1 exited (signal 3)');
                });

                test('cluster.fork was not called', function () {
                    assert.strictEqual(log.counts.fork, 2);
                });
            });
        });
    });
});

