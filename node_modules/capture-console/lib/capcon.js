var argle = require('argle');
var isFunction = require('lodash.isfunction');
var random = require('randomstring');

var unhooks = {};

/* Public */

/**
 * Executes the provided function with the output
 * on the provided streams. Accepts options to silence
 * the output going to the console.
 *
 * @param streams a stream or list of streams.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {Array} a list of stream outputs.
 */
function capture(streams, opts, exec) {
  var args = _shift(opts, exec);

  opts = args[0];
  exec = args[1];

  if (!Array.isArray(streams)) {
    streams = [ streams ];
  }

  var outputs = [];

  streams.forEach(function (stream, index) {
    outputs[index] = '';

    startCapture(stream, opts, function (output) {
      outputs[index] += output;
    });
  });

  exec();

  streams.forEach(stopCapture);

  return outputs;
}

/**
 * Captures stdout and stderr into an object for
 * the provided execution scope.
 *
 * @param opts to set flags on the capture.
 * @param exec the function execute inside the capture.
 * @returns {{stdout: String, stderr: String}}
 */
function captureStdio(opts, exec) {
  var streams = [
    process.stdout,
    process.stderr
  ];

  var outputs = capture(streams, opts, exec);

  return {
    stdout: outputs.shift(),
    stderr: outputs.shift()
  };
}

/**
 * Captures stderr for the provided execution scope.
 *
 * @param opts to set flags on the capture.
 * @param exec the function execute inside the capture.
 * @returns {String}
 */
function captureStderr(opts, exec) {
  return _baseCapture(process.stderr, opts, exec);
}

/**
 * Captures stdout for the provided execution scope.
 *
 * @param opts to set flags on the capture.
 * @param exec the function execute inside the capture.
 * @returns {String}
 */
function captureStdout(opts, exec) {
  return _baseCapture(process.stdout, opts, exec);
}

/**
 * Listens to a provided stream, and executes the provided
 * function for every write call. Accepts options to silence
 * the output going to the console.
 *
 * Returns a function to call when you wish to stop listening
 * to the call.
 *
 * @param stream a stream to listen on.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {Function}
 */
function hook(stream, opts, exec) {
  var args = _shift(opts, exec);

  opts = args[0];
  exec = args[1];

  var old_write = stream.write;

  stream.write = (function override(stream, writer) {
    return function write(string, encoding, fd) {
      exec(string, encoding, fd);

      if (!opts['quiet']) {
        writer.apply(stream, [ string, encoding, fd ]);
      }
    }
  })(stream, stream.write);

  return function unhook() {
    stream.write = old_write;
    return true;
  }
}

/**
 * Delegate to #capture with a quiet passthrough.
 *
 * @param stream a stream to listen on.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {Array} a list of stream outputs.
 */
function intercept(stream, opts, exec) {
  return _wrapIntercept(capture, stream, opts, exec);
}

/**
 * Delegate to #captureStdio with a quiet passthrough.
 *
 * @param opts to set flags on the capture.
 * @param exec the function execute inside the capture.
 * @returns {String}
 */
function interceptStdio(opts, exec) {
  return _wrapIntercept(captureStdio, opts, exec);
}

/**
 * Delegate to #captureStderr with a quiet passthrough.
 *
 * @param opts to set flags on the capture.
 * @param exec the function execute inside the capture.
 * @returns {String}
 */
function interceptStderr(opts, exec) {
  return _wrapIntercept(captureStderr, opts, exec);
}

/**
 * Delegate to #captureStdout with a quiet passthrough.
 *
 * @param opts to set flags on the capture.
 * @param exec the function execute inside the capture.
 * @returns {String}
 */
function interceptStdout(opts, exec) {
  return _wrapIntercept(captureStdout, opts, exec);
}

/**
 * Starts a capture on the provided stream using the
 * provided options and stream execution.
 *
 * @param stream a stream to listen on.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {boolean}
 */
function startCapture(stream, opts, exec) {
  var unhook = hook(stream, opts, exec);
  var str_id = random.generate();

  unhooks[str_id] = unhook;
  stream._id = str_id;

  return true;
}

/**
 * Stops a capture on the provided stream.
 *
 * @param stream a stream to stop the capture on.
 * @returns {boolean}
 */
function stopCapture(stream) {
  return !!(unhooks[stream._id] && unhooks[stream._id]());
}

/**
 * Delegate to #startCapture with a quiet passthrough.
 *
 * @param stream a stream to listen on.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {boolean}
 */
function startIntercept(stream, opts, exec) {
  return _wrapIntercept(startCapture, stream, opts, exec);
}

/**
 * Delegate to #stopCapture with a quiet passthrough.
 *
 * @param stream a stream to stop the capture on.
 * @returns {boolean}
 */
function stopIntercept(stream) {
  return stopCapture(stream);
}

/* Exports */

module.exports.hook = hook;
module.exports.capture = capture;
module.exports.captureStdio = captureStdio;
module.exports.captureStderr = captureStderr;
module.exports.captureStdout = captureStdout;
module.exports.intercept = intercept;
module.exports.interceptStdio = interceptStdio;
module.exports.interceptStderr = interceptStderr;
module.exports.interceptStdout = interceptStdout;
module.exports.startCapture = startCapture;
module.exports.stopCapture = stopCapture;
module.exports.startIntercept = startIntercept;
module.exports.stopIntercept = stopIntercept;

/* Private */

/**
 * Captures a given stream into a string.
 *
 * @param stream a stream to listen on.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {String}
 * @private
 */
function _baseCapture(stream, opts, exec) {
  return capture(stream, opts, exec).pop();
}

/**
 * Shifts an optional options argument against a
 * function to return defaults if not provided.
 *
 * @param opts options to verify.
 * @param exec a function to verify against.
 * @returns {{Object}, {Function}}
 * @private
 */
function _shift(opts, exec) {
  return argle.shift(
    [ opts, exec ],
    { defaults: [ {} ] },
    isFunction
  );
}

/**
 * Wraps capturing functions with quiet flags to
 * allow for interception.
 *
 * @param func the function to delegate to.
 * @param stream a stream to listen on.
 * @param opts to set flags on the capture.
 * @param exec the function to call with the output.
 * @returns {*}
 * @private
 */
function _wrapIntercept(func, stream, opts, exec) {
  var idex = Number(arguments.length > 3);
  var args = _shift(arguments[idex + 1], arguments[idex + 2]);

  opts = args[0];
  exec = args[1];

  opts.quiet = true;

  return idex
    ? func(stream, opts, exec)
    : func(opts, exec);
}
