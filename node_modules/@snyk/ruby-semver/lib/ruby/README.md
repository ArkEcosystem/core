DANGER: here be dragons!

The two classes in here are probably super weird to read. They're ruby
stdlib source code (see /ruby-src) hand converted to Javascript. The
structure and implementation is intentionally identical to the original
Ruby!

Originally they were transpiled using Opal, but this caused Typescript
compilation problems (as Opal does naughty things like monkey-patch
Object!), so we abandoned that.

The bits that weren't needed have been left as commented out Ruby, just
in case it aids future understanding. It's probably a good idea to look
at the ruby classes alongside these.
