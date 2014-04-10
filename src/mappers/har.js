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

var packageInfo = require('../../package.json'),
    check = require('check-types'),
    useragent = require('useragent'),
    url = require('url'),
    querystring = require('querystring');

module.exports = {
    initialise: function (/*options*/) {
        // Asynchronously update the user agent database.
        useragent(true);

        return map;
    }
};

function map (data, referer, userAgent) {
    if (!data.navtiming || !data.restiming) {
        return '';
    }

    return JSON.stringify({
        log: {
            version: '1.2',
            creator: {
                name: packageInfo.name,
                version: packageInfo.version
            },
            browser: getBrowser(userAgent),
            // HACK: The title must be set by the client with BOOMR.addVar(),
            //       otherwise we fall back to using the page URL.
            pages: getPages(data.navtiming, data.title || referer),
            entries: getEntries(data.restiming)
        }
    });
}

function getBrowser (userAgent) {
    var browser = useragent.lookup(userAgent).toJSON();

    return {
        name: browser.family,
        version: browser.major
    };
}

function getPages (data, title) {
    return [
        {
            startedDateTime: getTime(data.timestamps.start),
            id: '0',
            title: title || '',
            pageTimings: getPageTimings(data)
        }
    ];
}

function getTime (unixTime) {
    var time = new Date();
    time.setTime(unixTime);
    return time.toISOString();
}

function getPageTimings (data) {
    return {
        onContentLoad: data.events.domContent.start,
        onLoad: data.events.load.start
    };
}

function getEntries (data) {
    return data.map(function (datum) {
        var timings = getTimings(datum);

        return {
            pageref: '0',
            startedDateTime: getTime(datum.timestamps.start),
            time: Object.keys(timings).reduce(function (sum, name) {
                if (name === 'ssl' || check.not.positiveNumber(timings[name])) {
                    return sum;
                }

                return sum + timings[name];
            }, 0),
            request: getRequest(datum),
            response: getResponse(datum),
            cache: getCache(datum),
            timings: timings
        };
    });
}

function getRequest (data) {
    return {
        method: '',
        url: data.name,
        httpVersion: '',
        cookies: [],
        headers: [],
        queryString: getQueryString(data.name),
        headerSize: -1,
        bodySize: -1
    };
}

function getQueryString (urlString) {
    var parameters = querystring.parse(url.parse(urlString).query);

    return Object.keys(parameters).map(function (name) {
        return {
            name: name,
            value: parameters[name]
        };
    });
}

function getResponse (data) {
    return {
        status: -1,
        statusText: '',
        httpVersion: '',
        cookies: [],
        headers: [],
        content: getContent(data),
        redirectURL: '',
        headerSize: -1,
        bodySize: -1
    };
}

function getContent (/*data*/) {
    return {
        size: -1,
        mimeType: ''
    };
}

function getCache (/*data*/) {
    return {};
}

function getTimings (data) {
    return {
        blocked: data.timestamps.fetchStart - data.timestamps.start,
        dns: getOptionalEventDuration(data, 'dns'),
        connect: getOptionalEventDuration(data, 'connect'),
        // HACK: The resource timing API doesn't provide us with separate
        //       metrics for `send` and `wait`, so we're assigning all of
        //       the time to `send` and setting `wait` to zero.
        send: getOptionalEventDifference(data, 'response', 'start', 'requestStart'),
        wait: 0,
        receive: getOptionalEventDuration(data, 'response'),
        ssl: getOptionalEventDifference(data, 'connect', 'end', 'sslStart')
    };
}

function getOptionalEventDuration (data, eventName) {
    var event = data.events[eventName];

    if (!event) {
        return -1;
    }

    return event.end - event.start;
}

function getOptionalEventDifference (data, eventName, eventProperty, timestampName) {
    var event, timestamp;

    event = data.events[eventName];
    timestamp = data.timestamps[timestampName];

    if (!event || check.not.positiveNumber(timestamp)) {
        return -1;
    }

    return event[eventProperty] - timestamp;
}

