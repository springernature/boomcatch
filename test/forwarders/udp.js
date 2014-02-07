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

var mockery, assert, spooks, modulePath, nop;

mockery = require('mockery');
assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/forwarders/udp';

nop = function () {};

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');

suite('forwarders/udp:', function () {
    var log;

    setup(function () {
        log = {};
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('dgram', spooks.obj({
            archetype: { createSocket: nop },
            log: log,
            results: {
                createSocket: spooks.obj({
                    archetype: { send: nop, close: nop },
                    log: log
                })
            }
        }));
    });

    teardown(function () {
        mockery.deregisterMock('dgram');
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
        var udp;

        setup(function () {
            udp = require(modulePath);
        });

        teardown(function () {
            udp = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(udp.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                udp.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                udp.initialise({});
            });
        });

        suite('call initialise with default options:', function () {
            var forwarder;

            setup(function () {
                forwarder = udp.initialise({});
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(forwarder);
            });

            test('forwarder does not throw', function () {
                assert.doesNotThrow(function () {
                    forwarder();
                });
            });

            test('dgram.createSocket was not called', function () {
                assert.strictEqual(log.counts.createSocket, 0);
            });

            test('socket.send was not called', function () {
                assert.strictEqual(log.counts.send, 0);
            });

            suite('call forwarder:', function () {
                setup(function () {
                    forwarder('foo bar', spooks.fn({
                        name: 'callback',
                        log: log
                    });
                });

                test('dgram.createSocket was called once', function () {
                    assert.strictEqual(log.counts.createSocket, 1);
                });

                test('dgram.createSocket was called correctly', function () {
                    assert.strictEqual(log.these.createSocket[0], require('dgram'));
                    assert.lengthOf(log.args.createSocket[0], 1);
                    assert.strictEqual(log.args.createSocket[0][0], 'udp4');
                });

                test('socket.send was called once', function () {
                    assert.strictEqual(log.counts.send, 1);
                });

                test('socket.send was called correctly', function () {
                    assert.strictEqual(log.these.send[0], require('dgram').createSocket());
                    assert.lengthOf(log.args.send[0], 6);
                    assert.instanceOf(log.args.send[0][0], Buffer);
                    assert.strictEqual(log.args.send[0][0].toString(), 'foo bar');
                    assert.strictEqual(log.args.send[0][1], 0);
                    assert.strictEqual(log.args.send[0][2], 7);
                    assert.strictEqual(log.args.send[0][3], 8125);
                    assert.strictEqual(log.args.send[0][4], '127.0.0.1');
                    assert.isFunction(log.args.send[0][5]);
                });

                test('socket.close was not called', function () {
                    assert.strictEqual(log.counts.close, 0);
                });

                test('callback was not called', function () {
                    assert.strictEqual(log.counts.callback, 0);
                });

                suite('call callback:', function () {
                    setup(function () {
                        log.args.send[0][5]('foo', 'bar');
                    });

                    test('socket.close was called once', function () {
                        assert.strictEqual(log.counts.close, 1);
                    });

                    test('socket.close was called correctly', function () {
                        assert.strictEqual(log.these.callback[0], require('dgram').createSocket());
                        assert.lengthOf(log.args.callback[0], 0);
                    });

                    test('callback was called once', function () {
                        assert.strictEqual(log.counts.callback, 1);
                    });

                    test('callback was called correctly', function () {
                        assert.isNull(log.these.callback[0]);
                        assert.lengthOf(log.args.callback[0], 2);
                        assert.strictEqual(log.args.callback[0][0], 'foo');
                        assert.strictEqual(log.args.callback[0][0], 'bar');
                    });
                });
            });

            suite('call forwarder with alternative data:', function () {
                setup(function () {
                    forwarder('baz', spooks.fn({
                        name: 'callback',
                        log: log
                    });
                });

                test('dgram.createSocket was called once', function () {
                    assert.strictEqual(log.counts.createSocket, 1);
                });

                test('socket.send was called once', function () {
                    assert.strictEqual(log.counts.send, 1);
                });

                test('socket.send was called correctly', function () {
                    assert.strictEqual(log.args.send[0][0].toString(), 'baz');
                    assert.strictEqual(log.args.send[0][2], 3);
                });

                test('socket.close was not called', function () {
                    assert.strictEqual(log.counts.close, 0);
                });

                test('callback was not called', function () {
                    assert.strictEqual(log.counts.callback, 0);
                });
            });
        });

        suite('call initialise with custom host and port:', function () {
            var forwarder;

            setup(function () {
                forwarder = udp.initialise({
                    host: '192.168.50.4',
                    port: 5001
                });
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(forwarder);
            });

            test('dgram.createSocket was not called', function () {
                assert.strictEqual(log.counts.createSocket, 0);
            });

            test('socket.send was not called', function () {
                assert.strictEqual(log.counts.send, 0);
            });

            suite('call forwarder:', function () {
                setup(function () {
                    forwarder('foo bar', spooks.fn({
                        name: 'callback',
                        log: log
                    });
                });

                test('socket.send was called correctly', function () {
                    assert.strictEqual(log.args.send[0][3], 5001);
                    assert.strictEqual(log.args.send[0][4], '192.168.50.4');
                });
            });
        });
    });
});

