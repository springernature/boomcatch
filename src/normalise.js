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

/*globals module, require */

'use strict';

var check = require('check-types');

module.exports = normalise;

function normalise (data) {
    return {
        rt: normaliseRtData(data),
        navtiming: normaliseNavtimingData(data),
        restiming: normaliseRestimingData(data)
    };
}

function normaliseRtData (data) {
    /*jshint camelcase:false */

    var start, timeToFirstByte, timeToLastByte, timeToLoad;

    start = getOptionalDatum(data, 'rt.tstart');
    timeToFirstByte = getOptionalDatum(data, 't_resp');
    timeToLastByte = getOptionalSum(data, 't_resp', 't_page');
    timeToLoad = getOptionalDatum(data, 't_done');

    check.assert.maybe.positive(start);
    check.assert.maybe.positive(timeToFirstByte);
    check.assert.maybe.positive(timeToLastByte);
    check.assert.maybe.positive(timeToLoad);

    if (check.positive(timeToFirstByte) || check.positive(timeToLastByte) || check.positive(timeToLoad)) {
        return {
            timestamps: {
                start: start
            },
            events: {},
            durations: {
                firstbyte: timeToFirstByte,
                lastbyte: timeToLastByte,
                load: timeToLoad
            },
            url: data.r
        };
    }
}

function getOptionalDatum (data, key) {
    if (data[key]) {
        return parseInt(data[key]);
    }
}

function getOptionalSum (data, aKey, bKey) {
    if (data[aKey] && data[bKey]) {
        return parseInt(data[aKey]) + parseInt(data[bKey]);
    }
}

var normalisationMaps = {
    navtiming: {
        timestamps: [
            { key: 'nt_nav_st', name: 'start' },
            { key: 'nt_fet_st', name: 'fetchStart' },
            { key: 'nt_ssl_st', name: 'sslStart', optional: true },
            { key: 'nt_req_st', name: 'requestStart' },
            { key: 'nt_domint', name: 'domInteractive' }
        ],
        events: [
            { start: 'nt_unload_st', end: 'nt_unload_end', name: 'unload' },
            { start: 'nt_red_st', end: 'nt_red_end', name: 'redirect' },
            { start: 'nt_dns_st', end: 'nt_dns_end', name: 'dns' },
            { start: 'nt_con_st', end: 'nt_con_end', name: 'connect' },
            { start: 'nt_res_st', end: 'nt_res_end', name: 'response' },
            { start: 'nt_domloading', end: 'nt_domcomp', name: 'dom' },
            { start: 'nt_domcontloaded_st', end: 'nt_domcontloaded_end', name: 'domContent' },
            { start: 'nt_load_st', end: 'nt_load_end', name: 'load' }
        ],
        durations: []
    },
    restiming: {
        timestamps: [
            { key: 'rt_st', name: 'start' },
            { key: 'rt_fet_st', name: 'fetchStart' },
            { key: 'rt_scon_st', name: 'sslStart', optional: true },
            { key: 'rt_req_st', name: 'requestStart', optional: true }
        ],
        events: [
            { start: 'rt_red_st', end: 'rt_red_end', name: 'redirect', optional: true },
            { start: 'rt_dns_st', end: 'rt_dns_end', name: 'dns', optional: true },
            { start: 'rt_con_st', end: 'rt_con_end', name: 'connect', optional: true },
            { start: 'rt_res_st', end: 'rt_res_end', name: 'response', optional: true }
        ],
        durations: []
    }
};

function normaliseNavtimingData (data) {
    /*jshint camelcase:false */
    var result = normaliseCategory(normalisationMaps.navtiming, data, 'nt_nav_st');

    if (result) {
        result.type = data.nt_nav_type;
    }

    return result;
}

function normaliseCategory (map, data, startKey) {
    try {
        return {
            timestamps: normaliseTimestamps(map, data),
            events: normaliseEvents(map, data),
            durations: normaliseDurations(map, data, startKey)
        };
    } catch (e) {
    }
}

function normaliseTimestamps (map, data) {
    return map.timestamps.reduce(function (result, timestamp) {
        var value, assert;

        if (data[timestamp.key]) {
            value = parseInt(data[timestamp.key]);
        }

        assert = timestamp.optional ? check.assert.maybe : check.assert;
        assert.positive(value);

        if (value) {
            result[timestamp.name] = value;
        }

        return result;
    }, {});
}

function normaliseEvents (map, data) {
    return map.events.reduce(function (result, event) {
        var start, end, assert;

        if (data[event.start] && data[event.end]) {
            start = parseInt(data[event.start]);
            end = parseInt(data[event.end]);
        }

        assert = event.optional ? check.assert.maybe : check.assert;
        assert.number(start);
        check.assert.not.negative(start);
        assert.number(end);
        check.assert.not.negative(end);

        if (check.number(start) && check.number(end)) {
            result[event.name] = {
                start: start,
                end: end
            };
        }

        return result;
    }, {});
}

function normaliseDurations (map, data, startKey) {
    var start = parseInt(data[startKey]);

    return map.durations.reduce(function (result, duration) {
        var value, assert;

        if (data[duration.end]) {
            value = parseInt(data[duration.end]) - start;
        }

        assert = duration.optional ? check.assert.maybe : check.assert;
        assert.number(value);
        check.assert.not.negative(value);

        if (value) {
            result[duration.name] = value;
        }

        return result;
    }, {});
}

function normaliseRestimingData (data) {
    /*jshint camelcase:false */

    var result;

    if (data.restiming) {
        result = [];

        Object.keys(data.restiming).forEach(function (key) {
            var datum = normaliseCategory(normalisationMaps.restiming, data.restiming[key], 'rt_st');

            if (datum) {
                datum.name = data.restiming[key].rt_name;
                datum.type = data.restiming[key].rt_in_type;
            }

            result.push(datum);
        });

        return result;
    }
}

