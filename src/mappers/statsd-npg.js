// Copyright © 2014, 2015 Nature Publishing Group
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

var check, url, UserAgentParser, normalise, mappers;

check = require('check-types');
url = require('url');
UserAgentParser = require('ua-parser-js');
normalise = require('../normalise');

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

function map (prefix, data, referer, userAgent) {
    var result, refererPrefix, suffix;

    result = '';

    if (referer) {
        refererPrefix = getRefererPrefix(url.parse(referer));
    } else {
        refererPrefix = '';
    }

    suffix = getUserAgentSuffix(new UserAgentParser(userAgent));

    data = normalise(data);

    Object.keys(data).forEach(function (category) {
        var datum = data[category], mapper = mappers[category];

        if (check.object(datum) && check.function(mapper)) {
            result += mapper(prefix + refererPrefix + category + '.', suffix, datum);
        }
    });

    return result;
}

function getRefererPrefix (referer) {
    // HACK: This function and the functions it calls are brittle and error-prone.
    // TODO: Consider alternative methods for deriving this information, e.g. document metadata.
    return getRefererEnvironment(referer.host) + '.' + getRefererProject(referer.pathname) + '.';
}

function getRefererEnvironment (domain) {
    if (domain.indexOf('www.') === 0) {
        return 'live';
    }

    if (domain.indexOf('staging-www.') === 0) {
        return 'staging';
    }

    if (domain.indexOf('test-www.') === 0) {
        return 'test';
    }

    return 'development';
}

function getRefererProject (path) {
    var project;

    if (!path || path === '/') {
        return 'homepage';
    }

    project = path.substr(1);
    if (project.indexOf('/') !== -1) {
        project = project.substr(0, project.indexOf('/'));
    }

    return project.toLowerCase();
}

function getUserAgentSuffix (userAgent) {
    return '.' + getUserAgentEngine(userAgent) + '.' +
                 getUserAgentBrowser(userAgent) + '.' +
                 getUserAgentBrowserVersion(userAgent) + '.' +
                 getUserAgentDeviceType(userAgent) + '.' +
                 getUserAgentDeviceVendor(userAgent) + '.' +
                 getUserAgentOS(userAgent) + '.' +
                 getUserAgentOSVersion(userAgent);
}

function getUserAgentEngine (userAgent) {
    return getUserAgentComponent(userAgent, 'getEngine', 'name');
}

function getUserAgentComponent (userAgent, method, property, defaultResult) {
    var component = userAgent[method]()[property];

    if (component) {
        return stripNonAlphanumerics(component).toLowerCase();
    }

    return defaultResult || 'unknown';
}

function stripNonAlphanumerics (string) {
    return string.replace(/\W/g, '_');
}

function getUserAgentBrowser (userAgent) {
    return getUserAgentComponent(userAgent, 'getBrowser', 'name');
}

function getUserAgentBrowserVersion (userAgent) {
    return getUserAgentComponent(userAgent, 'getBrowser', 'version');
}

function getUserAgentDeviceType (userAgent) {
    return getUserAgentComponent(userAgent, 'getDevice', 'type', 'desktop');
}

function getUserAgentDeviceVendor (userAgent) {
    return getUserAgentComponent(userAgent, 'getDevice', 'vendor');
}

function getUserAgentOS (userAgent) {
    return getUserAgentComponent(userAgent, 'getOS', 'name');
}

function getUserAgentOSVersion (userAgent) {
    return getUserAgentComponent(userAgent, 'getOS', 'version');
}

mappers = {
    rt: mapRtData,
    navtiming: mapNavtimingData
};

function mapRtData (prefix, suffix, data) {
    return mapDurations(prefix, suffix, data);
}

function mapDurations (prefix, suffix, data) {
    return Object.keys(data.durations).map(function (metric) {
        var datum = data.durations[metric];

        if (check.number(datum)) {
            return mapMetric(prefix, metric, suffix, datum);
        }

        return '';
    }).join('');
}

function mapMetric (prefix, name, suffix, value) {
    if (value <= 0) {
        return '';
    }

    return prefix + name + suffix + ':' + value + '|ms' + '\n';
}

function mapNavtimingData (prefix, suffix, data) {
    return mapMetric(prefix, 'dns', suffix, data.events.dns.end - data.timestamps.start) +
           mapMetric(prefix, 'firstbyte', suffix, data.events.response.start - data.timestamps.start) +
           mapMetric(prefix, 'domload', suffix, data.events.domContent.start - data.timestamps.start) +
           mapMetric(prefix, 'load', suffix, data.events.load.start - data.timestamps.start);
}

