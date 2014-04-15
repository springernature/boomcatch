# mappers/statsd

The statsd mapper
transforms beacon data
into [statsd] [timers].

Currently,
this mapper will only
translate events and durations
from the [normalised data structure][format].
There is a plan to expand coverage
to incorporate non-`start` timestamps
in due course.

Mention: base 36 encoding for restiming data
Mention: reference implementation of base 36 decoding

[statsd]: https://github.com/etsy/statsd
[timers]: https://github.com/etsy/statsd/blob/master/docs/metric_types.md#timing
[format]: ../data.md

