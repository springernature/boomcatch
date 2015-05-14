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

var assert, modulePath;

assert = require('chai').assert;

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
                        r: 'http://www.example.com/foo',
                        'rt.tstart': '1',
                        t_resp: '2',
                        t_page: '3',
                        t_done: '4',
                        nt_nav_type: 'bar',
                        nt_nav_st: '5',
                        nt_fet_st: '6',
                        nt_ssl_st: '7',
                        nt_req_st: '8',
                        nt_domint: '9',
                        nt_unload_st: '10',
                        nt_unload_end: '20',
                        nt_red_st: '11',
                        nt_red_end: '22',
                        nt_dns_st: '12',
                        nt_dns_end: '24',
                        nt_con_st: '13',
                        nt_con_end: '26',
                        nt_res_st: '14',
                        nt_res_end: '28',
                        nt_domloading: '15',
                        nt_domcomp: '30',
                        nt_domcontloaded_st: '16',
                        nt_domcontloaded_end: '32',
                        nt_load_st: '17',
                        nt_load_end: '34',
                        restiming: {
                            0: {
                                rt_st: '18',
                                rt_fet_st: '19',
                                rt_scon_st: '20',
                                rt_req_st: '21',
                                rt_red_st: '22',
                                rt_red_end: '44',
                                rt_dns_st: '23',
                                rt_dns_end: '46',
                                rt_con_st: '24',
                                rt_con_end: '48',
                                rt_res_st: '25',
                                rt_res_end: '50',
                                rt_name: 'http://www.example.com/baz',
                                rt_in_type: 'css'
                            },
                            1: {
                                rt_st: '26',
                                rt_fet_st: '27',
                                rt_scon_st: '28',
                                rt_req_st: '29',
                                rt_red_st: '30',
                                rt_red_end: '60',
                                rt_dns_st: '31',
                                rt_dns_end: '62',
                                rt_con_st: '32',
                                rt_con_end: '64',
                                rt_res_st: '33',
                                rt_res_end: '66',
                                rt_name: 'http://www.example.com/qux',
                                rt_in_type: 'img'
                            }
                        }
                    }, 'wibble');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'rt.firstbyte:2|ms',
                        'rt.lastbyte:5|ms',
                        'rt.load:4|ms',
                        'navtiming.unload:10|ms',
                        'navtiming.redirect:11|ms',
                        'navtiming.dns:12|ms',
                        'navtiming.connect:13|ms',
                        'navtiming.response:14|ms',
                        'navtiming.dom:15|ms',
                        'navtiming.domContent:16|ms',
                        'navtiming.load:17|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.redirect:22|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.dns:23|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.connect:24|ms',
                        'restiming.3b2x2q2q302t.0.css.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b2q2p3e.response:25|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.redirect:30|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.dns:31|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.connect:32|ms',
                        'restiming.3b2x2q2q302t.1.img.2w3838341m1b1b3b3b3b1a2t3c2p3134302t1a2r33311b35393c.response:33|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with alternative data:', function () {
                var result;

                setup(function () {
                    result = mapper({ t_done: '10' });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'rt.load:10|ms\n');
                });
            });

            // TODO: Reinstate this test when normalisation has been removed, issue #55.
            /*suite('call mapper with zero value:', function () {
                var result;

                setup(function () {
                    result = mapper({ t_done: '0' });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, '');
                });
            });*/

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
                    result = mapper({ t_done: '1' });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'foo.rt.load:1|ms\n');
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
                    result = mapper({ t_done: '2' });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'bar.rt.load:2|ms\n');
                });
            });
        });
    });
});

