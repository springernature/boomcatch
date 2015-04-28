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
    useragent = require('useragent');

module.exports = {
    initialise: function (/*options*/) {
        // Asynchronously update the user agent database.
        useragent(true);

        return map;
    },
    type: 'json'
};

function map (data, referer, userAgent) {

    var out = { 
      data: data,
      referrer: referer,
      userAgent: userAgent,
      browser: getBrowser(userAgent)
    };
    return JSON.stringify(out);

}

function getBrowser (userAgent) {
    var browser = useragent.lookup(userAgent).toJSON();

    return {
        name: browser.family,
        version: browser.major
    };
}

