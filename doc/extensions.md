# Extensions

Boomcatch provides
four extension points,
which are invoked
as a pipeline
when a beacon request
is received.
Those extension points,
in order of invocation,
are:

1. [Validators]:
   These functions
   are predicates,
   which can check
   that the request
   meets your specific requirements,
   then signal whether
   to continue processing
   or fail the request.

2. [Filters]:
   This extension point
   isn't actually implemented yet.
   When it's done,
   it will enable you
   to filter out
   unwanted parts
   of the data
   before it is passed
   to the mapper.

3. [Mappers]:
   These functions
   transform the [normalised data][data]
   into a format
   suitable for consumption
   by some other process.

4. [Forwarders]:
   These functions
   conclude processing
   by sending the mapped data
   onto another process.

In each case,
extensions are loaded with `require`,
employing a two-pass approach
to enable loading of custom extensions.
The first attempt is made
with the relevant extension directory
prefixed to the module path.
If that attempt throws,
a second attempt is made
using the specified module path verbatim.
Thus,
standard extensions
will be loaded on the first attempt
and custom extensions
will be loaded on the second.

[validators]: validators/README.md
[option]: ../README.md#from-the-command-line
[filters]: filters/README.md
[mappers]: mappers/README.md
[data]: data.md
[forwarders]: forwarders/README.md

