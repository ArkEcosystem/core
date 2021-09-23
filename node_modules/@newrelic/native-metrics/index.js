'use strict'

var EventEmitter = require('events').EventEmitter
var util = require('util')
var preBuild = require('./lib/pre-build')
var natives = preBuild.load('native_metrics')


var DEFAULT_TIMEOUT = 15 * 1000 // 15 seconds
var GC_TYPE_NAMES = {
  '1': 'Scavenge',
  '2': 'MarkSweepCompact',
  '4': 'IncrementalMarking',
  '8': 'ProcessWeakCallbacks',

  '3': 'All', // Node v4 and earlier only have Scavenge and MarkSweepCompact.
  '15': 'All'
}


/**
 * Constructs a metric emitter. This constructor is for internal use only.
 *
 * {@link NativeMetricEmitter#bind} is called as part of construction.
 *
 * @constructor
 * @classdesc
 *  Emits events for various native events or periodic sampling.
 *
 * @param {number} [opts.timeout]
 *  The number of milliseconds between samplings. Defaults to 15 seconds.
 */
function NativeMetricEmitter(opts) {
  opts = opts || {timeout: DEFAULT_TIMEOUT}
  EventEmitter.call(this)
  this.bound = false
  this._timeout = null

  this._rusageMeter = new natives.RUsageMeter()
  this.usageEnabled = true

  this._gcBinder = new natives.GCBinder()
  this.gcEnabled = true

  this._loopChecker = new natives.LoopChecker()
  this.loopEnabled = true

  this.bind(opts.timeout)
}
util.inherits(NativeMetricEmitter, EventEmitter)

/**
 * @interface RUsageStats
 *
 * @description
 *  Resource usage statistics.
 *
 *  Properties marked (X) are unmaintained by the operating system and are
 *  likely to be just `0`.
 *
 * @property {number} ru_utime    - user CPU time used in milliseconds
 * @property {number} ru_stime    - system CPU time used in milliseconds
 * @property {number} ru_maxrss   - maximum resident set size in bytes
 * @property {number} ru_ixrss    - integral shared memory size (X)
 * @property {number} ru_idrss    - integral unshared data size (X)
 * @property {number} ru_isrss    - integral unshared stack size (X)
 * @property {number} ru_minflt   - page reclaims (soft page faults) (X)
 * @property {number} ru_majflt   - page faults (hard page faults)
 * @property {number} ru_nswap    - swaps (X)
 * @property {number} ru_inblock  - block input operations
 * @property {number} ru_oublock  - block output operations
 * @property {number} ru_msgsnd   - IPC messages sent (X)
 * @property {number} ru_msgrcv   - IPC messages received (X)
 * @property {number} ru_nsignals - signals received (X)
 * @property {number} ru_nvcsw    - voluntary context switches (X)
 * @property {number} ru_nivcsw   - involuntary context switches (X)
 *
 * @see http://docs.libuv.org/en/v1.x/misc.html#c.uv_getrusage
 * @see http://docs.libuv.org/en/v1.x/misc.html#c.uv_rusage_t
 */

/**
 * @interface LoopMetrics
 *
 * @description
 *  A mapping of loop concepts to metrics about them. All values are in
 *  microseconds.
 *
 * @property {Metric} usage - CPU usage per tick metrics.
 */

/**
 * @interface GCMetrics
 *
 * @description
 *  Garbage collection results.
 *
 * @property {number} typeId  - The numeric ID of the gc type.
 * @property {string} type    - The nice name version of the gc type.
 * @property {Metric} metrics - Accumulated metric data in milliseconds.
 */

/**
 * @interface Metric
 *
 * @description
 *  A bundle of values taken from some measurement.
 *
 * @property {number} total         - The sum of all values measured.
 * @property {number} min           - The smallest value measured.
 * @property {number} max           - The largest value measured.
 * @property {number} sumOfSquares  - The sum of the square of each value.
 * @property {number} count         - The number of values measured.
 */

/**
 * Binds the emitter to the internal, V8 hooks to start populating data.
 *
 * @fires NativeMetricEmitter#gc
 * @fires NativeMetricEmitter#usage
 *
 * @param {number} [timeout]
 *  The number of milliseconds between samplings. Defaults to 15 seconds.
 */
NativeMetricEmitter.prototype.bind = function bind(timeout) {
  if (this.bound) {
    return
  }

  timeout = timeout || DEFAULT_TIMEOUT
  this._gcBinder.bind()
  this._loopChecker.bind()

  this._timeout = setTimeout(nativeMetricTimeout.bind(this), timeout).unref()
  function nativeMetricTimeout() {
    if (this._rusageMeter) {
      /**
       * Resource usage sampling event.
       *
       * @event NativeMetricEmitter#usage
       * @type {object}
       *
       * @property {RUsageStats} diff     - The change in stats since last sampling.
       * @property {RUsageStats} current  - The current usage statistics.
       */
      this.emit('usage', this._rusageMeter.read())
    }
    if (this.bound) {
      this._timeout = setTimeout(nativeMetricTimeout.bind(this), timeout).unref()
    }
  }

  this.bound = true
}

/**
 * Removes internal hooks and stops any open sampling timers.
 */
NativeMetricEmitter.prototype.unbind = function unbind() {
  if (!this.bound) {
    return
  }

  this._gcBinder.unbind()
  this._loopChecker.unbind()
  clearTimeout(this._timeout)
  this.bound = false
}

/**
 * Retrieves the current loop metrics and resets the counters.
 *
 * @return {LoopMetrics} The current loop metrics.
 */
NativeMetricEmitter.prototype.getLoopMetrics = function getLoopMetrics() {
  return this._loopChecker.read()
}

/**
 * Retrieves the accumulated garbage collection metrics.
 *
 * After retrieval, the metrics are reset internally. Only GC types that have
 * happened at least once since the last retrieval are returned.
 *
 * @return {object.<string,GCMetrics>} An object mapping GC type names to
 *  information on the GC events that happened.
 */
NativeMetricEmitter.prototype.getGCMetrics = function getGCMetrics() {
  var gcMetrics = this._gcBinder.read()
  var results = Object.create(null)
  for (var typeId in gcMetrics) {
    if (gcMetrics.hasOwnProperty(typeId) && gcMetrics[typeId].count > 0) {
      var typeName = GC_TYPE_NAMES[String(typeId)]
      results[typeName] = {
        typeId: parseInt(typeId, 10),
        type: typeName,
        metrics: gcMetrics[typeId]
      }
    }
  }

  return results
}

var emitter = null

/**
 * Retrieves the {@link NativeMetricEmitter} singleton instance.
 *
 * @param {object} [opts]
 *  Options for constructing the emitter. See {@link NativeMetricEmitter} for
 *  default values. Only used on the first call to construct the instance.
 */
module.exports = function getMetricEmitter(opts) {
  if (!emitter) {
    emitter = new NativeMetricEmitter(opts)
  }
  return emitter
}
