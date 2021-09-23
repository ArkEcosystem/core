<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# catbox-memory

Memory adapter for [catbox](https://github.com/hapijs/catbox).
This adapter is not designed to share a common cache between multiple processes (e.g. in a cluster
mode). It uses a single interval timeout to look for expired records and clean them from memory.

[![Build Status](https://api.travis-ci.org/hapijs/catbox-memory.svg)](https://travis-ci.org/hapijs/catbox-memory)

### Options

- `maxByteSize` - sets an upper limit on the number of bytes that can be stored in the
  cache. Once this limit is reached no additional items will be added to the cache
  until some expire. The utilized memory calculation is a rough approximation and must
  not be relied on. Defaults to `104857600` (100MB).
- `minCleanupIntervalMsec` - the minimum number of milliseconds in between each cache cleanup.
  Defaults to 1 second (`1000`).
- `cloneBuffersOnGet` - by default, buffers stored in the cache are copied when they are set but
  not when they are retrieved. This means a change to the buffer returned by a `get()` will change
  the value in the cache. To prevent this, set `cloneBuffersOnGet` to  `true` to always return a
  copy of the cached buffer. Defaults to `false`.
