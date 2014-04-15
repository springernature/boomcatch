# mappers/statsd-npg

The statsd-npg mapper
is a fork
of the [statsd mapper][statsd],
which only maps
the metrics
we're graphing
at NPG.

Data from
the round trip plugin
is mapped as follows:

```
<prefix>.rt.firstbyte:<time>|ms
<prefix>.rt.lastbyte:<time>|ms
<prefix>.rt.load:<time>|ms
```

Data from
the navigation timing plugin
is mapped like so:

```
<prefix>.navtiming.dns:<time>|ms
<prefix>.navtiming.firstbyte:<time>|ms
<prefix>.navtiming.domload:<time>|ms
<prefix>.navtiming.load:<time>|ms
```

These timers are calculated
as follows:

* `dns`:
  `data.navtiming.events.dns.end - data.navtiming.timestamps.start`

* `firstbyte`:
  `data.navtiming.events.response.start - data.navtiming.timestamps.start`

* `domload`:
  `data.navtiming.events.domContent.start - data.navtiming.timestamps.start`

* `load`:
  `data.navtiming.events.load.start - data.navtiming.timestamps.start`

[statsd]: statsd.md

