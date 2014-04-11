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

/*globals module */

'use strict';

module.exports = {
    // Metric definitions for use by data mappers. There are currently three categories
    // of metric, corresponding to three different boomerang plugins: rt, navtiming and
    // restiming.
    //
    // Within each category, there are three types of metric that are available for
    // data mappers: timestamps, durations and events.
    //
    //     * timestamps: milliseconds since the epoch for some event.
    //     * events: an object with `start` and `end` timestamp properties.
    //     * durations: milliseconds difference between the start timestamp and some
    //                  other point.
    rt: {
        timestamps: [ 'start' ],
        events: [],
        durations: [ 'firstbyte', 'lastbyte', 'load' ]
    },
    navtiming: {
        timestamps: [ 'start', 'fetchStart', 'sslStart', 'requestStart', 'domInteractive' ],
        events: [ 'unload', 'redirect', 'dns', 'connect', 'response', 'dom', 'domContent', 'load' ],
        durations: []
    },
    restiming: {
        timestamps: [ 'start', 'fetchStart', 'sslStart', 'requestStart' ],
        events: [ 'redirect', 'dns', 'connect', 'response' ],
        durations: []
    }
};

