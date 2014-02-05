'use strict';

/*globals require, exports */

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
        if (metrics.hasOwnProperty(category)) {
            result += mapMetrics(metrics[category], prefix + category + '.', data[category]);
        }
    }

    return result;
}

function mapMetrics (metrics, prefix, data) {
    return metrics.map(function (metric) {
        return prefix + metric + ':' + data[metric] + '|ms';
    });
}

