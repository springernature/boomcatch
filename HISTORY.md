# History

## 2.2.0

* Enable HTTPS support.

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
* Reversion of an earlier, [misguided attempt](https://github.com/nature/boomcatch/issues/33) to infer load times for `beforeunload` beacon data.
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

