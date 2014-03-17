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

/*globals require, exports */

'use strict';

var check = require('check-types'),
    metrics = require('../metrics');

exports.initialise = function (options) {
    return map.bind(null, normalisePrefix(options.prefix));
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
    var result = '', mapper;

    Object.keys(metrics).forEach(function (category) {
        if (data.hasOwnProperty(category)) {
            if (category === 'rtapi') {
                mapper = mapResourceTimingMetrics;
            } else {
                mapper = mapMetrics;
            }

            result += mapper(metrics[category], prefix + category + '.', data[category], referer);
        }
    });

    return result;
}

function mapResourceTimingMetrics (metrics, prefix, data, referer) {
    return data.map(function (resource, index) {
        /*jshint camelcase:false */
        return mapMetrics(metrics, [
            prefix + base36Encode(referer),
            index,
            resource.type,
            base36Encode(resource.name)
        ].join('.') + '.', resource);
    }).join('');
}

function base36Encode (string) {
    return Array.prototype.map.call(string, function (character) {
        return character.charCodeAt(0).toString(36);
    }).join('');
}

function mapMetrics (metrics, prefix, data) {
    return mapTimestamps(metrics, prefix, data) + mapDurations(metrics, prefix, data);
}

function mapTimestamps (metrics, prefix, data) {
    return mapStuff(metrics.timestamps, prefix, data, 'g');
}

function mapStuff (metrics, prefix, data, suffix) {
    return metrics.map(function (metric) {
        if (check.number(data[metric])) {
            return prefix + metric + ':' + data[metric] + '|' + suffix + '\n';
        }

        return '';
    }).join('');
}

function mapDurations (metrics, prefix, data) {
    return mapStuff(metrics.durations, prefix, data, 'ms');
}

