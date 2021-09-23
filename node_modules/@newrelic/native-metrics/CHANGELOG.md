### v5.0.0 (2019-10-16):

* **BREAKING** Removed support for Node 6, 7, 9 and 11.

  The minimum supported version of the native metrics module is now Node v8. For further information on our support policy, see: https://docs.newrelic.com/docs/agents/nodejs-agent/getting-started/compatibility-requirements-nodejs-agent.

* Added support for Node v12.

### v4.1.0 (2019-02-07):

* Added support for insecure (http) binary hosts. Use at your own discretion.

  The default host remains as New Relic's binary repository behind an `https`
  server. To use an `http` endpoint you must manually configure it yourself.

  Special thanks to Adam Brett (@adambrett) and Guilherme Nagatomo (@guilhermehn)
  for contributing this feature.

### v4.0.0 (2019-01-22):

* **BREAKING**: Dropped support for Node versions <6.

* Added pre-execution log message calling out that this is an optional
  dependency in the agent.

* Simplified final error by removing most of the confusing `Failed to...`
  messages.

### v3.1.2 (2018-10-22):

* Corrected check for build flags to base on gyp version, not Node version.

  Previously, when checking if the old `\t:` syntax should be used, this looked
  for Node <10.8.0. Now this looks for node-gyp <3.7.0. This accounts for
  situations where users install their own versions of node-gyp.

  Special thanks to Eric Boureau (@eboureau) for contributing this fix.

### v3.1.1 (2018-09-10):

* Fixed building the module on Windows with Node v10.8.0 or greater.

  Special thanks to Elmar Burke (@elmarburke) for this contribution!

### v3.1.0 (2018-07-02):

* Added support for caching prebuilt binaries for firewalled deployments.

  Simply set the `NR_NATIVE_METRICS_DOWNLOAD_HOST` environment variable to the
  protocol and host for the download (e.g. `http://your-internal-cache/`) and
  `NR_NATIVE_METRICS_REMOTE_PATH` to the path to the download folder (e.g.
  `path/to/downloads/folder`).

  Special thanks to Adam Brett (@adambrett) for contributing this feature.

* Added support and pre-built binaries for Node 10.

### v3.0.0 (2018-06-04):

* **BREAKING** Removed support for Node 0.12.

  The minimum supported version of the native metrics module is now Node v4.

* **BREAKING** Removed `gc` event in favor of `getGCMetrics()` method.

  The `gc` event will no longer be emitted for each garbage collection by V8.
  Instead, metrics for garbage collections are aggregated in C++ and can be
  retrieved by calling `getGCMetrics()`. Like `getLoopMetrics()`, this new
  method will reset the aggregated metrics.

* Added pre-built binaries for Node 5 and 7.

### v2.4.0 (2018-04-20):

* Added `NR_NATIVE_METRICS_NO_BUILD` and `NR_NATIVE_METRICS_NO_DOWNLOAD`
  environment variables.

  These are just environment variable versions of the `--no-build` and
  `--no-download` flags introduced in v2.3.0.

### v2.3.0 (2018-04-19):

* Added `--no-build` and `--no-download` flags for install script.

  These flags prevent the installer for the native metrics from either building
  or downloading binaries. If both are specified, `--no-download` is ignored.

### v2.2.0 (2018-02-12):

* The package will now pull down pre-built binaries if compilation fails.

  After confirming that the binary downloading functionality works, the feature
  has been enabled by default.  The installation script will still default to a
  fresh build where possible, using the download option as a fall back.

* The process will no longer be held open due to pending timers.

  Previously, the timer used to calculate the CPU usage by a tick of the event
  loop was left pending, causing the process to hang.  


### v2.1.2 (2017-09-26):

* Metric timers no longer hold the process open.

Thanks to @samshull for the contribution!

### v2.1.1 (2017-04-03):

* Fixed build error on Windows thanks to Maximilian Haupt (@0x7f).

* Added C++-layer unit testing using [gtest](https://github.com/google/googletest).

* Updated readme with correct installation for the New Relic Agent v1.

### v2.1.0 (2017-02-06):

* Added an event loop CPU usage metric.

  The module will now report round trip CPU usage metrics for Node's event loop. This
  metric can be read off with `nativeMetrics.getLoopMetrics()` and will
  represent the amount of CPU time per tick of the event loop.

### v2.0.2 (2017-01-19):

* Removed pre-compiling binaries using the `node-pre-gyp` module.

  Previously we provided pre-compiled binaries for certain platforms and versions of Node.
  However, this caused issues for customers using shrinkwrapping.  In order to support
  shrinkwrapping as well as all versions of Node and npm that our customers use, we have
  decided to remove this feature.  This means that in order to use this module, users now
  need to have a compiler on the machine where it is being installed.
  See [node-gyp] (https://www.npmjs.com/package/node-gyp#installation) for more
  information on compiling native addons.

### v2.0.0 (2017-01-04):

* Removed support for Node 0.10.

  The `segfault-handler` dependency no longer compiles on Node 0.10 in our tests.

* The `node-pre-gyp` module is now a bundled dependency.

  Previously it was installed using a preinstall script, which was causing an issue with
  shrinkwrapping parent projects.  Thanks to Robert Rossman (@Alaneor) for
  the contribution!

* Added License section to the Readme file.

### v1.0.0 (2016-12-07):

* General release. No code changes from v0.1.1.

### v0.1.1 (2016-12-05):

* Added guard against binding GC events more than once.

* Removed OS X from Travis to temporarily get around extremely long builds.
  Added script to run tests locally across multiple versions of Node.

* Added test for checking licenses of dependencies.

### v0.1.0 (2016-11-29):

* Added `gc` event with duration and type of garbage collection.
* Added `usage` event with current and diff of resource usage stats.
