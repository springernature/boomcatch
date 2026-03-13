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

var mockery, assert, spooks, modulePath;

mockery = require('mockery');
assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/forwarders/file';

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');
mockery.registerAllowable('uuid');
mockery.registerAllowable('crypto');

suite('forwarders/file:', function () {
    var log;

    setup(function () {
        log = {};
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('path', {
            join: spooks.fn({
                name: 'join',
                log: log,
                results: [ 'mock path.join result' ]
            })
        });
        mockery.registerMock('fs', {
            writeFile: spooks.fn({
                name: 'writeFile',
                log: log
            })
        });
    });

    teardown(function () {
        mockery.deregisterMock('fs');
        mockery.deregisterMock('path');
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
        var file;

        setup(function () {
            file = require(modulePath);
        });

        teardown(function () {
            file = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(file.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                file.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                file.initialise({});
            });
        });

        suite('call initialise:', function () {
            var forwarder;

            setup(function () {
                forwarder = file.initialise({ fwdDir: 'wibble' });
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(forwarder);
            });

            test('path.join was not called', function () {
                assert.strictEqual(log.counts.join, 0);
            });

            test('fs.writeFile was not called', function () {
                assert.strictEqual(log.counts.writeFile, 0);
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

                test('path.join was called once', function () {
                    assert.strictEqual(log.counts.join, 1);
                });

                test('path.join was called correctly', function () {
                    assert.strictEqual(log.these.join[0], require('path'));
                    assert.lengthOf(log.args.join[0], 2);
                    assert.strictEqual(log.args.join[0][0], 'wibble');
                    assert.match(log.args.join[0][1], /^boomcatch-[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}.txt$/);
                });

                test('fs.writeFile was called once', function () {
                    assert.strictEqual(log.counts.writeFile, 1);
                });

                test('fs.request was called correctly', function () {
                    assert.strictEqual(log.these.writeFile[0], require('fs'));
                    assert.lengthOf(log.args.writeFile[0], 4);
                    assert.strictEqual(log.args.writeFile[0][0], 'mock path.join result');
                    assert.strictEqual(log.args.writeFile[0][1], 'foo bar\n');
                    assert.isObject(log.args.writeFile[0][2]);
                    assert.lengthOf(Object.keys(log.args.writeFile[0][2]), 1);
                    assert.strictEqual(log.args.writeFile[0][2].mode, 420);
                    assert.isFunction(log.args.writeFile[0][3]);
                });

                suite('call forwarder:', function () {
                    setup(function () {
                        forwarder('foo bar', null, null, function () {});
                    });

                    test('path.join was called once', function () {
                        assert.strictEqual(log.counts.join, 2);
                    });

                    test('path.join was called correctly', function () {
                        assert.match(log.args.join[1][1], /^boomcatch-[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}.txt$/);
                        assert.notEqual(log.args.join[0][1], log.args.join[1][1]);
                    });

                    test('callback was not called', function () {
                        assert.strictEqual(log.counts.callback, 0);
                    });
                });

                suite('call writeFile callback:', function () {
                    setup(function () {
                        log.args.writeFile[0][3]('some error');
                    });

                    test('callback was called once', function () {
                        assert.strictEqual(log.counts.callback, 1);
                    });

                    test('callback was called correctly', function () {
                        assert.isUndefined(log.these.callback[0]);
                        assert.lengthOf(log.args.callback[0], 2);
                        assert.strictEqual(log.args.callback[0][0], 'some error');
                        assert.strictEqual(log.args.callback[0][1], 7);
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

                test('path.join was called correctly', function () {
                    assert.match(log.args.join[0][1], /^boomcatch-[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}.json$/);
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

                test('path.join was called correctly', function () {
                    assert.match(log.args.join[0][1], /^boomcatch-[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}.html$/);
                });
            });
        });
    });
});

