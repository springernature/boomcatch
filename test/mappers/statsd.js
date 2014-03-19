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

modulePath = '../../src/mappers/statsd';

suite('mappers/statsd:', function () {
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
        var statsd;

        setup(function () {
            statsd = require(modulePath);
        });

        teardown(function () {
            statsd = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(statsd.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                statsd.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                statsd.initialise({});
            });
        });

        suite('call initialise with default options:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({});
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            test('mapper throws without data', function () {
                assert.throws(function () {
                    mapper();
                });
            });

            test('mapper does not throw with empty data', function () {
                assert.doesNotThrow(function () {
                    mapper({});
                });
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        boomerang: {
                            start: 1,
                            firstbyte: 2,
                            load: 3
                        },
                        navtiming: {
                            start: 4,
                            redirect: 5,
                            dns: 6,
                            connect: 7,
                            firstbyte: 8,
                            domload: 9,
                            load: 10
                        },
                        restiming: [
                            {
                                name: 'http://www.example.com/foo',
                                type: 'css',
                                start: 11,
                                redirect: 12,
                                dns: 13,
                                connect: 14,
                                firstbyte: 15,
                                load: 16
                            },
                            {
                                name: 'foo bar baz qux',
                                type: 'img',
                                start: 17,
                                redirect: 18,
                                dns: 19,
                                connect: 20,
                                firstbyte: 21,
                                load: 22
                            }
                        ]
                    }, 'wibble');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'boomerang.start:1|g',
                        'boomerang.firstbyte:2|ms',
                        'boomerang.load:3|ms',
                        'navtiming.start:4|g',
                        'navtiming.redirect:5|ms',
                        'navtiming.dns:6|ms',
                        'navtiming.connect:7|ms',
                        'navtiming.firstbyte:8|ms',
                        'navtiming.domload:9|ms',
                        'navtiming.load:10|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2u3333.start:11|g',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2u3333.redirect:12|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2u3333.dns:13|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2u3333.connect:14|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2u3333.firstbyte:15|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2u3333.load:16|ms',
                        'restiming.3b2x2q2q302t.1.img.2u3333w2q2p36w2q2p3ew35393c.start:17|g',
                        'restiming.3b2x2q2q302t.1.img.2u3333w2q2p36w2q2p3ew35393c.redirect:18|ms',
                        'restiming.3b2x2q2q302t.1.img.2u3333w2q2p36w2q2p3ew35393c.dns:19|ms',
                        'restiming.3b2x2q2q302t.1.img.2u3333w2q2p36w2q2p3ew35393c.connect:20|ms',
                        'restiming.3b2x2q2q302t.1.img.2u3333w2q2p36w2q2p3ew35393c.firstbyte:21|ms',
                        'restiming.3b2x2q2q302t.1.img.2u3333w2q2p36w2q2p3ew35393c.load:22|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with alternative data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        navtiming: {
                            start: 111,
                            redirect: 222,
                            dns: 333,
                            connect: 444,
                            firstbyte: 555,
                            domload: 666,
                            load: 777
                        },
                        boomerang: {
                            load: 888
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'boomerang.load:888|ms',
                        'navtiming.start:111|g',
                        'navtiming.redirect:222|ms',
                        'navtiming.dns:333|ms',
                        'navtiming.connect:444|ms',
                        'navtiming.firstbyte:555|ms',
                        'navtiming.domload:666|ms',
                        'navtiming.load:777|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with no data:', function () {
                var result;

                setup(function () {
                    result = mapper({});
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, '');
                });
            });
        });

        suite('call initialise with prefix:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({
                    prefix: 'foo.'
                });
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        boomerang: {
                            load: 1
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'foo.boomerang.load:1|ms\n');
                });
            });
        });

        suite('call initialise with unterminated prefix:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({
                    prefix: 'bar'
                });
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        boomerang: {
                            load: 2
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'bar.boomerang.load:2|ms\n');
                });
            });
        });
    });
});

