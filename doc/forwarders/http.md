# forwarders/http

The http forwarder sends data via [HTTP] or [HTTPS]. It accepts two options: `fwdUrl` and `fwdMethod` (`-U` and `-M` on the command line, respectively).

* `fwdUrl`: URL to forward data to.
* `fwdMethod`: HTTP method to use for the request. The default is `'GET'`.

If the active [mapper] has specified a data type, this will be used to set the `Content-Type` header appropriately.

[http]: http://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol
[https]: http://en.wikipedia.org/wiki/HTTP_Secure
[mapper]: ../mappers/README.md
