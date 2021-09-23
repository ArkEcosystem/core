
# Native Metrics for New Relic Node Agent

This module provides hooks into the native layer of Node to provide metrics for
the [New Relic Node Agent][npm-newrelic]. It gathers information that isn't
available at the JS layer about the V8 virtual machine and the process health.
It comes packaged with the New Relic Agent since v2, and there is nothing that
needs to be done. For Agent v1 you need only to install the module alongside
[`newrelic`][npm-newrelic].

## Installation

`npm install --save @newrelic/native-metrics`

Note that this is a native module and thus must be compiled to function.
Pre-built binaries are provided for Linux servers running supported versions of
Node. If you are not using Linux or not using a supported version of Node, you
will need to have a compiler installed on the machine where this is to be
deployed. See [node-gyp](https://www.npmjs.com/package/node-gyp#installation)
for more information on compiling native addons.

If you prepare and package deployments on one machine and install them on
another, the two machines must have the same operating system and architecture.
If they are not, you will need to re-build the native module after deploying in
order to get the correct binaries.

During installation, the module will first attempt build from source on the
target machine. If that fails, it will attempt to download a pre-built binary
for your system. You can disable the download attempt by setting
`NR_NATIVE_METRICS_NO_DOWNLOAD` to `true` in your environment before
installation.

```sh
$ export NR_NATIVE_METRICS_NO_DOWNLOAD=true
$ npm install @newrelic/native-metrics
```

If you would like to skip the build step and only attempt to download a
pre-build binary, set `NR_NATIVE_METRICS_NO_BUILD` to `true`.

```sh
$ export NR_NATIVE_METRICS_NO_BUILD=true
$ npm install @newrelic/native-metrics
```

If both env vars are set, `NO_BUILD` will override `NO_DOWNLOAD`.

If you are working behind a firewall and want to cache the downloads internally
you can set the value of the download host and remote path instead of forcing a
build:

```sh
$ export NR_NATIVE_METRICS_DOWNLOAD_HOST=http://your-internal-cache/
$ export NR_NATIVE_METRICS_REMOTE_PATH=path/to/download/folder/
$ npm install @newrelic/native-metrics
```

## Usage

```js
var getMetricEmitter = require('@newrelic/native-metrics')

var emitter = getMetricEmitter()
if (emitter.gcEnabled) {
  setInterval(() => {
    var gcMetrics = emitter.getGCMetrics()
    for (var type in gcMetrics) {
      console.log('GC type name:', type)
      console.log('GC type id:', gcMetrics[type].typeId)
      console.log('GC metrics:', gcMetrics[type].metrics)
    }
  }, 1000)
}
if (emitter.usageEnabled) {
  emitter.on('usage', (usage) => console.log(usage))
}
if (emitter.loopEnabled) {
  setInterval(() => {
    var loopMetrics = emitter.getLoopMetrics()
    console.log('Total time:', loopMetrics.usage.total)
    console.log('Min time:', loopMetrics.usage.min)
    console.log('Max time:', loopMetrics.usage.max)
    console.log('Sum of squares:', loopMetrics.usage.sumOfSquares)
    console.log('Count:', loopMetrics.usage.count)
  }, 1000)
}
```

The metric emitter keeps a referenced timer running for its periodic sampling
events. For a graceful shutdown of the process call `NativeMetricEmitter#unbind`.

```js
getMetricEmitter().unbind() // Process will now close gracefully.
```

If you would like to change the period of the sampling, simply unbind and then
call `NativeMetricEmitter#bind` with the new period.

```js
var emitter = getMetricEmitter({timeout: 15000})
emitter.unbind()
emitter.bind(10000) // Samples will now fire once every 10 seconds.
```

## License

The New Relic native metrics module is free-to-use, proprietary software. Please
see the full license (found in [LICENSE](LICENSE)) for details on its license
and the licenses of its dependencies.

[npm-newrelic]: https://www.npmjs.com/package/newrelic
