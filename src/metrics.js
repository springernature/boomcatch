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

// There are three categories of metric: boomerang, navtiming and
// restiming.
//
//     * boomerang: data recorded by boomerang.
//     * navtiming: data extracted from the W3C Navigation Timing API.
//     * restiming: data extracted from the W3C Resource Timing API.
//
// Within each category, there are three types of metric: timestamps,
// durations and events.
//
//     * timestamps: milliseconds since the epoch.
//     * durations: milliseconds difference between start timestamp
//                  and some event
//     * events: object with `start` and `end` timestamp properties.

module.exports = {
    boomerang: {
        timestamps: [ 'start' ],
        durations: [ 'firstbyte', 'load' ]
    },
    navtiming: {
        timestamps: [ 'start' ],
        durations: [ 'redirect', 'dns', 'connect', 'firstbyte', 'domload', 'load' ]
    },
    restiming: {
        timestamps: [ 'start' ],
        durations: [ 'redirect', 'dns', 'connect', 'firstbyte', 'load' ]
    }
};

