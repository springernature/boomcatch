# History

## 1.4.1

* Switch to a [node 0.11 compatible version of toobusy](https://github.com/dannycoates/node-toobusy/tree/node11).

## 1.4.0

* Add option to control number of worker processes.
* Improve reliability of default forwarders.
* Fail fast when the server is too busy.

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

