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

function map (prefix, data) {
    var category, result = '';

    for (category in metrics) {
        if (metrics.hasOwnProperty(category) && data.hasOwnProperty(category)) {
            result += mapMetrics(metrics[category], prefix + category + '.', data[category]);
        }
    }

    return result;
}

function mapMetrics (metrics, prefix, data) {
    return metrics.map(function (metric) {
        return prefix + metric + ':' + data[metric] + '|ms\n';
    }).join('');
}

