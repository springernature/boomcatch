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

module.exports = {
    initialise: function (options) {
        return map;
    }
};

function map (data, referer, userAgent, remoteAddress) {
    if (Array.isArray(data.restiming)) {
        JSON.stringify(data.restiming.map(mapResource));
    }

    return '';
}

function mapResource (resource) {
    return {
        name: resource.name,
        type: resource.type,
        start: resource.timestamps.start,
        timings: [
            mapEvent('redirect', resource),
            mapEvent('dns', resource),
            mapEvent('connect', resource),
            mapRequestTiming(resource),
            mapEvent('response', resource)
        ]
    };
}

function mapEvent (event) {
    var result = [
        mapEvent('redirect', events, start),
        mapEvent('dns', events, start),
        mapEvent('connect', events, start),
        mapResponseEvent('firstbyte', events.response.start, start),
        mapResponseEvent('lastbyte', events.response.end, start)
    ];
}

function mapEvent (name, resource) {
    return mapTiming(name, resource.events[name]);
}

function mapTiming (name, event) {
    if (event) {
        return {
            name: name,
            start: event.start,
            duration: event.end - event.start
        };
    }

    return mapEvent(name, { start: 0, end: 0 });
}

function mapRequestTiming (resource) {
    var requestTiming;

    if (resource.timestamps.requestStart && resource.events.response) {
        requestTiming = {
            start: resource.timestamps.requestStart,
            end: resource.events.response.start
        };
    }

    return mapTiming('request', requestTiming);
}

