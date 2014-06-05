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

/*jshint nomen:false */
/*globals module, require, __dirname */

'use strict';

var fs = require('fs'),
    path = require('path'),
    check = require('check-types'),
    handlebars = require('handlebars'),
    packageInfo = require('../../package.json');

module.exports = {
    initialise: function (options) {
        return map.bind(null, getTemplate(options), getSettings(options));
    }
};

function getTemplate (options) {
    return handlebars.compile(
        fs.readFileSync(
            options.svgTemplate ||
            path.join(__dirname, 'template.html'),
            { encoding: 'utf8' }
        )
    );
}

function getSettings (options) {
    var settings = require(options.svgSettings || './settings.json');

    verifySettings(settings);

    settings.xAxis = {
        x: settings.width / 1.8,
        y: settings.offset.y / 2 - settings.padding
    };

    settings.resourceHeight = settings.barHeight + settings.padding;
    settings.barPadding = Math.floor(settings.padding / 2);

    return settings;
}

function verifySettings (settings) {
    check.verify.positiveNumber(settings.width, 'Invalid SVG width');
    check.verify.object(settings.offset, 'Invalid SVG offset');
    check.verify.positiveNumber(settings.offset.x, 'Invalid SVG x offset');
    check.verify.positiveNumber(settings.offset.x, 'Invalid SVG y offset');
    check.verify.positiveNumber(settings.barHeight, 'Invalid SVG bar height');
    check.verify.positiveNumber(settings.padding, 'Invalid SVG padding');
    check.verify.array(settings.colours, 'Invalid SVG colours');

    if (settings.colours.length !== 6) {
        throw new Error('Incorrect number of SVG colours');
    }

    settings.colours.forEach(function (colour, index) {
        check.verify.object(colour, 'Invalid SVG colour [' + index + ']');
        check.verify.unemptyString(colour.name, 'Invalid SVG colour name [' + index + ']');
        check.verify.unemptyString(colour.value, 'Invalid SVG colour value [' + index + ']');
        check.verify.unemptyString(colour.fg, 'Invalid SVG foreground colour [' + index + ']');
    });
}

function map (template, settings, data, referer) {
    var resources;

    if (!Array.isArray(data.restiming)) {
        return '';
    }

    resources = data.restiming.map(mapResource);

    return template({
        version: packageInfo.version,
        title: referer,
        svg: customiseSvgSettings(settings, resources),
        details: resources
    });
}

function mapResource (resource, index) {
    var start, duration, result;

    start = resource.timestamps.start;
    duration = Object.keys(resource.events).reduce(
        getResourceDuration.bind(null, resource),
        resource.timestamps.fetchStart - start
    );

    result = {
        index: index,
        name: resource.name,
        type: resource.type,
        start: start,
        duration: duration,
        timings: [
            mapTiming('blocked', { start: start, end: start + duration }),
            mapEvent('redirect', resource),
            mapEvent('dns', resource),
            mapEvent('connect', resource),
            mapRequestTiming(resource),
            mapEvent('response', resource)
        ]
    };

    result.timings[0].blocked = true;

    return result;
}

function getResourceDuration (resource, duration, eventName) {
    var eventDuration = resource.events[eventName].end - resource.timestamps.start;

    if (eventDuration > duration) {
        return eventDuration;
    }

    return duration;
}

function mapTiming (name, event) {
    if (event) {
        return {
            name: name,
            start: event.start,
            duration: event.end - event.start
        };
    }

    return mapTiming(name, { start: 0, end: 0 });
}

function mapEvent (name, resource) {
    return mapTiming(name, resource.events[name]);
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

function customiseSvgSettings (settings, resources) {
    var result = {};

    Object.keys(settings).forEach(function (name) {
        result[name] = settings[name];
    });

    result.height = getSvgHeight(result, resources);
    result.scale = getSvgScale(result, resources);
    result.ticks = getSvgTicks(result, resources);
    result.resources = resources.map(mapSvgResource.bind(null, result));

    return result;
}

function getSvgHeight (settings, resources) {
    return (resources.length + 1) * (settings.barHeight + settings.padding) + settings.offset.x;
}

function getSvgScale (settings, resources) {
    var minimum, maximum, step, difference, pixelsPerUnit;

    minimum = resources[0].start;
    maximum = resources.reduce(getMaximumValue, 0);
    step = 20 * Math.ceil(Math.log(maximum - minimum) / Math.log(10));
    maximum += 10 - (maximum % 10);
    minimum -= minimum % 10;
    difference = maximum - minimum;
    pixelsPerUnit = (settings.width - settings.offset.x) / difference;

    return {
        start: minimum,
        step: step,
        size: difference,
        to: function (value) {
            if (value === 0) {
                return 0;
            }

            return (value - minimum) * pixelsPerUnit;
        }
    };
}

function getSvgTicks (settings, resources) {
    var height, ticks, i, value;

    height = resources.length * (settings.barHeight + settings.padding);

    ticks = new Array(Math.ceil(settings.scale.size / settings.scale.step));

    for (i = 0; i < ticks.length; i += 1) {
        value = settings.scale.start + i * settings.scale.step;

        ticks[i] = {
            x: settings.scale.to(value),
            height: height,
            value: value
        };
    }

    return ticks;
}

function getMaximumValue (maximum, resource) {
    var end = resource.start + resource.duration;

    if (end > maximum) {
        return end;
    }

    return maximum;
}

function mapSvgResource (settings, resource) {
    return {
        index: resource.index,
        y: resource.index * settings.resourceHeight,
        timings: resource.timings.map(mapSvgTiming.bind(null, settings)),
        label: getSvgLabel(settings, resource)
    };
}

function mapSvgTiming (settings, timing, index) {
    return {
        x: settings.scale.to(timing.start),
        width: settings.scale.to(settings.scale.start + timing.duration),
        name: settings.colours[index].name
    };
}

function getSvgLabel (settings, resource) {
    return {
        y: settings.barHeight / 2,
        text: getResourceName(resource)
    };
}

function getResourceName (resource) {
    var separatorIndex, resourceName = resource.name;

    separatorIndex = resourceName.indexOf('?');
    if (separatorIndex !== -1) {
        resourceName = resourceName.substr(0, separatorIndex);
    }

    separatorIndex = resourceName.lastIndexOf('/');
    if (separatorIndex !== -1) {
        resourceName = resourceName.substr(separatorIndex + 1);
    }

    return resourceName;
}

