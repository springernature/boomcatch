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

/*globals require, module */
/*jshint camelcase:false */

'use strict';

var packageInfo = require('../../package.json'),
    check = require('check-types'),
    useragent = require('useragent'),
    url = require('url'),
    querystring = require('querystring');

var ResourceTimingDecompression = require("resourcetiming-compression").ResourceTimingDecompression;

module.exports = {
    initialise: function (/*options*/) {
        // Asynchronously update the user agent database.
        useragent(true);

        return map;
    },
    type: 'json'
};

function map (data, referer, userAgent) {
    if (!data.nt_nav_st || !data.restiming) {
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
            pages: getPages(data, data.title || referer),
            entries: ResourceTimingDecompression.decompressResources(JSON.parse(data.restiming))
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
            startedDateTime: getTime(data.nt_nav_st),
            id: '0',
            title: title || '',
            pageTimings: getPageTimings(data)
        }
    ];
}

function getTime (unixTime) {
    var time = new Date();
    time.setTime(parseInt(unixTime));
    return time.toISOString();
}

function getPageTimings (data) {
    return {
        onContentLoad: parseInt(data.nt_domcontloaded_st),
        onLoad: parseInt(data.nt_load_st)
    };
}

function getEntries (data) {
    var result = [];

    Object.keys(data).forEach(function (key) {
        var datum, timings;

        datum = data[key];
        timings = getTimings(datum);

        result.push({
            pageref: '0',
            startedDateTime: getTime(datum.rt_st),
            time: Object.keys(timings).reduce(function (sum, name) {
                if (name === 'ssl' || check.not.positive(timings[name])) {
                    return sum;
                }

                return sum + timings[name];
            }, 0),
            request: getRequest(datum),
            response: getResponse(datum),
            cache: getCache(datum),
            timings: timings
        });
    });

    return result;
}

function getRequest (data) {
    return {
        method: '',
        url: data.rt_name,
        httpVersion: '',
        cookies: [],
        headers: [],
        queryString: getQueryString(data.rt_name),
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
        blocked: parseInt(data.rt_fet_st) - parseInt(data.rt_st),
        dns: getOptionalDuration(data.rt_dns_st, data.rt_dns_end),
        connect: getOptionalDuration(data.rt_con_st, data.rt_con_end),
        // HACK: The resource timing API doesn't provide us with separate
        //       metrics for `send` and `wait`, so we're assigning all of
        //       the time to `send` and setting `wait` to zero.
        send: getOptionalDuration(data.rt_req_st, data.rt_res_st),
        wait: 0,
        receive: getOptionalDuration(data.rt_res_st, data.rt_res_end),
        ssl: getOptionalDuration(data.rt_scon_st, data.rt_con_end)
    };
}

function getOptionalDuration (start, end) {
    start = parseInt(start);
    end = parseInt(end);

    if (check.not.number(start) || check.not.number(end)) {
        return -1;
    }

    return end - start;
}

