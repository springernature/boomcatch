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

var packageInfo = require('../package.json'),
    check = require('check-types'),
    metrics = require('../metrics');

module.exports = {
    initialise: function (options) {
        return map;
    },
    separator: '\n'
};

function map (data, referer, userAgent, ipAddress) {
    return JSON.stringify({
        log: {
            version: '1.2',
            creator: {
                name: packageInfo.name,
                version: packageInfo.version
            },
            browser: getBrowser(userAgent),
            pages: getPages(data),
            entries: getEntries(data)
        }
    });
}

function getBrowser (userAgent) {
    // TODO
    return {
        name: '',
        version: ''
    };
}

function getPages (data) {
}

function getEntries (data) {
}

