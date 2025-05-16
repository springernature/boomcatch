# History

## 3.2.7

* Update to `handlebars` that fixes high severity vulnerabilities.
* Update to `ua-parser-js` that fixes a high severity vulnerability.
* Update to `mockery`.
* Updates to last available version of `request`.
* Updates `useragent`
* Update to `cheerio` that fixes a high severity vulnerability.
* Update to `jshint` that fixes a high severity vulnerability.

## 3.2.6

* Pin `ua-parseer-js` to a safe and known to be working version
* Replace deprecated `worker.suicide` calls
* Remove unused statsd-npg mapper
* Documentation improvements

## 3.2.5

* Update to `qs` that fixes a high severity vulnerability: [https://snyk.io/vuln/npm:qs:20170213](https://snyk.io/vuln/npm:qs:20170213). A partial fix was released in versions 6.0.3, 6.1.1, 6.2.2, 6.3.1 but only 6.4.0 (released today) contains the final fix.

## 3.2.4

* Update to `qs` that fixes a high severity vulnerability: [https://snyk.io/vuln/npm:qs:20170213](https://snyk.io/vuln/npm:qs:20170213)

## 3.2.3

* Switch from deprecated `node-uuid` to `uuid` version 3.0.0 (thanks @marcbachmann)

## 3.1.3

* Update to handlebars 4 that fixes several security vulnerabilities:
    - [https://nodesecurity.io/advisories/39](https://nodesecurity.io/advisories/39)
    - [https://nodesecurity.io/advisories/48](https://nodesecurity.io/advisories/48)
    - [https://nodesecurity.io/advisories/61](https://nodesecurity.io/advisories/61)
    - [https://nodesecurity.io/advisories/77](https://nodesecurity.io/advisories/77)
* Updates other packages to recent versions.

## 3.1.2

* Adds Travis test for node 6 and updates the refs for node 4 and 5

## 3.1.1

* Update repository references to springernature
* Update the license

## 3.1.0

* Updating documentation to reflect the current Node.js support of 0.10 and later.
* Switching out `jsdom` for `cheerio` within the tests

## 3.0.4

* Fix unhandled error when UDP sending fails.

## 3.0.3

* Improve error logging.

## 3.0.2

* Fix undefined dereference in statsd mapper.
* Sanely handle floating point restiming data.

## 3.0.1

* Improve error logging.
* Fix bad referer-handling in statsd mappers.
* Sane normalisation of zero t_resp values.

## 3.0.0

* Breaking change: remove the normalisation step (thanks @emaV).
* Add `unmapped` mapper (thanks @emaV).

## 2.2.1

* Remove arbitrary limit on the number of POST request body parameters (thanks @emaV).

## 2.2.0

* Enable HTTPS support (thanks @tollmanz).

## 2.1.0

* Support for node.js 0.12.
* Update dependencies.
* Syslog formatting change as a result of switch from rconsole to ain2.

## 2.0.2

* Improve logging when worker processes terminate.

## 2.0.0

* Add options `--delayRespawn` and `--maxRespawn`.
* Don't respawn workers that have intentionally exited.
* Logging tweaks.

## 1.8.1

* Normalise projects to lower case in the statsd-npg mapper.

## 1.8.0

* Remove engine version metadata from the statsd-npg data mapper.

## 1.7.1

* Fix broken chunking behaviour in UDP forwarder.
* Re-use UDP sockets when chunking.

## 1.7.0

* Ignore zero values in statsd mappers.

## 1.6.0

* Modify the statsd-npg data mapper to incorporate referer and user agent information.

## 1.5.2

* Prevent mappers from failing requests if they return the empty string.

## 1.5.1

* Proper toleration of `beforeunload` beacon data.
* Reversion of an earlier, [misguided attempt](https://github.com/springernature/boomcatch/issues/33) to infer load times for `beforeunload` beacon data.
* Add the user agent details to the log.
* Improve accessibility in the SVG waterfall mapper.

## 1.5.0

* Expose data type from mappers.
* Replace JSON waterfall mapper with an SVG waterfall mapper.

## 1.4.5

* Tolerate reduced round-trip data.

## 1.4.4

* Improve the logging of process management, signals and uncaught exceptions.

## 1.4.3

* Switch to a [pure JS implementation of toobusy](https://github.com/STRML/node-toobusy).

## 1.4.1

* Switch to a [node 0.11 compatible version of toobusy](https://github.com/dannycoates/node-toobusy/tree/node11).

## 1.4.0

* Add option to control number of worker processes.
* Improve reliability of default forwarders.
* Fail fast when the server is too busy.
* NOTE: Node 0.8 is no longer supported.

## 1.3.6

* Expose resource duration in the waterfall mapper.

## 1.3.5

* Fix path bug in file forwarder.

## 1.3.4

* Implement a waterfall mapper.
* Implement a file forwarder.

## 1.3.3

* Implement a console forwarder.
* Fix a bug in the HTTP forwarder.

## 1.3.2

* Fix normalisation of zeroed events.

## 1.3.1

* Fix overly-strict data checks in normalisation routines.

## 1.3.0

* Implement filters.
* Document extensions and data format.

## 1.2.1

* Add a statsd/NPG mapper.

## 1.2.0

* Tidy up the data format.
* Implement HTTP archive data mapper.
* Add support for syslog-compatible logging.

## 1.1.2

* Implement data chunking in the UDP forwarder.

## 1.1.1

* Return HTTP status 200 from successful POST requests.

## 1.1.0

* Support boomerang's restiming plugin.
* Support boomerang's beacon_type option.
* Add option to control Access-Control-Allow-Origin header.
* Add option to control maximum body size for POST requests.
* Fail requests when data mappers return the empty string.
* Change statsd namespace ntapi => navtiming to better harmonise with boomerang.

## 1.0.0

* Initial release.
