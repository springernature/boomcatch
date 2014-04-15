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

/*globals require, module */

'use strict';

var check = require('check-types'), mappers;

module.exports = {
    initialise: function (options) {
        return map.bind(null, normalisePrefix(options.prefix));
    },
    separator: '\n'
};

function normalisePrefix (prefix) {
    if (check.unemptyString(prefix)) {
        if (prefix[prefix.length - 1] === '.') {
            return prefix;
        }

        return prefix + '.';
    }

    return '';
}

function map (prefix, data, referer) {
    var result = '';

    Object.keys(data).forEach(function (category) {
        var datum = data[category], mapper = mappers[category];

        if (check.object(datum) && check.fn(mapper)) {
            result += mapper(prefix + category + '.', datum, referer);
        }
    });

    return result;
}

mappers = {
    rt: mapRtData,
    navtiming: mapNavtimingData
};

function mapRtData (prefix, data) {
    return mapDurations(prefix, data);
}

function mapDurations (prefix, data) {
    return Object.keys(data.durations).map(function (metric) {
        var datum = data.durations[metric];

        if (check.number(datum)) {
            return mapMetric(prefix, metric, datum);
        }

        return '';
    }).join('');
}

function mapMetric (prefix, name, value) {
    return prefix + name + ':' + value + '|ms' + '\n';
}

function mapNavtimingData (prefix, data) {
    return mapMetric(prefix, 'dns', data.events.dns.end - data.timestamps.start) +
           mapMetric(prefix, 'firstbyte', data.events.response.start - data.timestamps.start) +
           mapMetric(prefix, 'domload', data.events.domContent.start - data.timestamps.start) +
           mapMetric(prefix, 'load', data.events.load.start - data.timestamps.start);
}

