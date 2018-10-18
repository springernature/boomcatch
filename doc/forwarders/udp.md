# forwarders/udp

The udp forwarder sends data via [UDP]. It accepts three options: `fwdHost`, `fwdPort` and `fwdSize` (`-N`, `-P` and `-Z` from the command line, respectively).

* `fwdHost`: Host name to forward data to. The default is `127.0.0.1`.
* `fwdPort`: Port to forward data on. The default is `8125` (statsd's default port).
* `fwdSize`: Maximum allowable packet size in bytes for forwarded data. The default is `512`.

When data is received, it is checked to see whether the length is greater than `fwdSize`. If it isn't, the data is sent in a single packet. If it is, the data is broken across multiple packets. In that event, the active [mapper][mappers] can contribute to chunking behaviour by exporting a separator string. If specified, the udp mapper will search for occurrences of this separator in the mapped data and attempt to break it into packets at those points.

[udp]: http://en.wikipedia.org/wiki/User_Datagram_Protocol
[mappers]: ../mappers/README.md
