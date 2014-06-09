# forwarders/file

The file forwarder
writes data to the file system.
It accepts one option:
`fwdDir` (`-D` on the command line).

* `fwdDir`:
  Directory to write data to.

Each beacon request
is written to a separate file
in the nominated directory.

If the active [mapper]
has specified
a data type,
this will be used to set
an appropriate file extension.

This forwarder is currently very rudimentary
and has no awareness of file system limits
regarding the maximum number of files per directory.
The generated file names
contain a [UUID]
to avoid naming clashes.

[uuid]: http://www.ietf.org/rfc/rfc4122.txt
[mapper]: ../mappers/README.md

