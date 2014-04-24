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

var assert, spooks, modulePath;

assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/forwarders/log';

suite('forwarders/log:', function () {
    var log;

    setup(function () {
        log = {};
    });

    teardown(function () {
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
        var logForwarder;

        setup(function () {
            logForwarder = require(modulePath);
        });

        teardown(function () {
            logForwarder = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(logForwarder.initialise);
        });

        test('no other functions are exported', function () {
            assert.lengthOf(Object.keys(logForwarder), 1);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                logForwarder.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                logForwarder.initialise({});
            });
        });

        suite('call initialise with log object:', function () {
            var forwarder;

            setup(function () {
                forwarder = logForwarder.initialise({
                    log: {
                        info: spooks.fn({
                            name: 'info',
                            log: log
                        })
                    }
                });
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(forwarder);
            });

            test('forwarder throws without arguments', function () {
                assert.throws(function () {
                    forwarder();
                });
            });

            test('forwarder does not throw with arguments', function () {
                assert.doesNotThrow(function () {
                    forwarder('', function () {});
                });
            });

            test('log.info was not called', function () {
                assert.strictEqual(log.counts.info, 0);
            });

            suite('call forwarder:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('foo bar', callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('log.info was called once', function () {
                    assert.strictEqual(log.counts.info, 1);
                });

                test('log.info was called correctly', function () {
                    assert.lengthOf(log.args.info[0], 1);
                    assert.strictEqual(log.args.info[0][0], 'foo bar');
                });

                test('callback was called once', function () {
                    assert.strictEqual(log.counts.callback, 1);
                });

                test('callback was called correctly', function () {
                    assert.isUndefined(log.these.callback[0]);
                    assert.lengthOf(log.args.callback[0], 2);
                    assert.isNull(log.args.callback[0][0]);
                    assert.strictEqual(log.args.callback[0][1], 7);
                });
            });

            suite('call forwarder with alternative data:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('baz', callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('log.info was called correctly', function () {
                    assert.strictEqual(log.args.info[0][0], 'baz');
                });

                test('callback was called correctly', function () {
                    assert.strictEqual(log.args.callback[0][1], 3);
                });
            });
        });

        suite('call forwarder with bad log:', function () {
            setup(function () {
                logForwarder.initialise({ log: {} })('foo bar', spooks.fn({
                    name: 'callback',
                    log: log
                }));
            });

            test('callback was called once', function () {
                assert.strictEqual(log.counts.callback, 1);
            });

            test('callback was called correctly', function () {
                assert.isUndefined(log.these.callback[0]);
                assert.lengthOf(log.args.callback[0], 1);
                assert.strictEqual(log.args.callback[0][0], 'Object #<Object> has no method \'info\'');
            });
        });
    });
});

