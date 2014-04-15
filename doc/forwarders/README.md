# Forwarders

Forwarders are the fourth
and final
stage of the
extension pipeline,
after
[validators],
[filters]
and [mappers].
Their purpose
is to send
mapped data
onto some other process.

The choice of forwarder
can be specified
at the command line,
using the `-f` [option].

Two forwarders
are available out-of-the-box,
[udp]
and [http].

[validators]: ../validators/README.md
[filters]: ../filters/README.md
[mappers]: ../mappers/README.md
[option]: ../../README.md#from-the-command-line
[udp]: udp.md
[http]: http.md

