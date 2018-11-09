# Extensions

Boomcatch provides four extension points, which are invoked as a pipeline when a beacon request is received.

![boomcatch extensions' diagram](https://github.com/springernature/boomcatch/blob/master/doc/boomcatch-extensions.png)

Those extension points, in order of invocation, are:

1. [Validators]: These functions are predicates, which can check that the request meets your specific requirements, then signal whether to continue processing or fail the request. One validator ([permissive]) is available by default.

2. [Filters]: These functions filter out unwanted parts of the data before it is passed to the mapper. One filter ([unfiltered]) is available by default.

3. [Mappers]: These functions transform the data into a format suitable for consumption by some other process. Four mappers ([har], [statsd], [unmapped] and [waterfall]) are available out-of-the-box.

4. [Forwarders]: These functions conclude processing by sending the mapped data onto another process. Four forwarders ([console], [file], [http] and [udp]) are available out-of-the-box.

In each case, extensions are loaded with `require`, employing a two-pass approach to enable loading of custom extensions. The first attempt is made with the relevant extension directory prefixed to the module path. If that attempt throws, a second attempt is made using the specified module path verbatim. Thus, standard extensions will be loaded on the first attempt and custom extensions will be loaded on the second.

[validators]: validators/README.md
[permissive]: validators/permissive.md
[option]: ../README.md#from-the-command-line
[filters]: filters/README.md
[unfiltered]: filters/unfiltered.md
[data]: data.md
[mappers]: mappers/README.md
[har]: mappers/har.md
[statsd]: mappers/statsd.md
[unmapped]: mappers/unmapped.md
[waterfall]: mappers/waterfall.md
[forwarders]: forwarders/README.md
[console]: forwarders/console.md
[file]: forwarders/file.md
[http]: forwarders/http.md
[udp]: forwarders/udp.md
