'use strict'

// This file is largely based upon the work done for node-pre-gyp. We are not
// using that module directly due to issues we've run into with the intricacies
// of various node and npm versions that we must support.
// https://www.npmjs.com/package/node-pre-gyp

// XXX This file must not have any deps. This file will run during the install
// XXX step of the module and we are _not_ guaranteed that the dependencies have
// XXX already installed. Core modules are okay.
var cp = require('child_process')
var fs = require('fs')
var http = require('http')
var https = require('https')
var os = require('os')
var path = require('path')
var semver = require('semver')
var zlib = require('zlib')


var CPU_COUNT = os.cpus().length
var IS_WIN = process.platform === 'win32'
var HAS_OLD_NODE_GYP_ARGS_FOR_WINDOWS = semver.lt(gypVersion() || '0.0.0', '3.7.0')
var S3_BUCKET = 'nr-downloads-main'

var DOWNLOAD_HOST = process.env.NR_NATIVE_METRICS_DOWNLOAD_HOST
                  || 'https://download.newrelic.com/'

var REMOTE_PATH = process.env.NR_NATIVE_METRICS_REMOTE_PATH
                || 'nodejs_agent/builds/'

var PACKAGE_ROOT = path.resolve(__dirname, '..')
var BUILD_PATH = path.resolve(PACKAGE_ROOT, './build/Release')

var opts = {}
exports.load = load

if (require.main === module) {
  var argv = parseArgs(process.argv, opts)
  executeCli(argv[2], argv[3])
}

function _getFileName(target) {
  var abi = process.versions.modules
  var arch = process.arch
  var platform = process.platform
  var pkg = require('../package')
  var pkgName = pkg.name.replace(/[^\w]/g, '_')
  var pkgVersion = pkg.version.toString().replace(/[^\w]/g, '_')

  if (!abi || !arch || !target || !platform || !pkg || !pkgName || !pkgVersion) {
    throw new Error('Missing information for naming compiled binary.')
  }

  return [pkgName, pkgVersion, target, abi, platform, arch].join('-')
}

function getBinFileName(target) {
  return _getFileName(target) + '.node'
}

function getPackageFileName(target) {
  return _getFileName(target) + '.gz'
}

function load(target) {
  return require(path.join(BUILD_PATH, getBinFileName(target)))
}

function makePath(pathToMake, cb) {
  var accessRights = null
  if (fs.constants) {
    accessRights = fs.constants.R_OK | fs.constants.W_OK
  } else {
    // TODO: Remove this when deprecating Node v5 and below.
    accessRights = fs.R_OK | fs.W_OK
  }

  // We only want to make the parts after the package directory.
  pathToMake = path.relative(PACKAGE_ROOT, pathToMake)

  // Now that we have a relative path, split it into the parts we need to make.
  var pathParts = pathToMake.split(path.sep)
  _make(-1, PACKAGE_ROOT, cb)

  function _make(i, p, cb) {
    if (++i >= pathParts.length) {
      return cb()
    }
    p = path.join(p, pathParts[i])

    fs.access(p, accessRights, function fsAccessCB(err) {
      if (!err) {
        // It exists and we have read+write access! Move on to the next part.
        return _make(i, p, cb)
      } else if (err.code !== 'ENOENT') {
        // It exists but we don't have read+write access! This is a problem.
        return cb(new Error('Do not have access to "' + p + '": ' + err))
      }

      // It probably does not exist, so try to make it.
      fs.mkdir(p, function fsMkDirCB(err) {
        if (err) {
          return cb(err)
        }
        _make(i, p, cb)
      })
    })
  }
}

function findNodeGyp() {
  // This code heavily borrows from node-pre-gyp.
  // https://github.com/mapbox/node-pre-gyp/blob/e0b3b6/lib/util/compile.js#L18-L55

  // First, look for it in the NPM environment variable.
  var gypPath = null
  if (process.env.npm_config_node_gyp) {
    try {
      gypPath = process.env.npm_config_node_gyp
      if (fs.existsSync(gypPath)) {
        return gypPath
      }
    } catch (err) {
      // This method failed, hopefully the next will succeed...
    }
  }

  // Next, see if the package is installed somewhere.
  try {
    var gypPkgPath = require.resolve('node-gyp')
    gypPath = path.resolve(gypPkgPath, '../../bin/node-gyp.js')
    if (fs.existsSync(gypPath)) {
      return gypPath
    }
  } catch (err) {
    // This method failed, hopefully the next will succeed...
  }

  // Then look for it in NPM's install location.
  try {
    var npmPkgPath = require.resolve('npm')
    gypPath = path.resolve(npmPkgPath, '../../node_modules/node-gyp/bin/node-gyp.js')
    if (fs.existsSync(gypPath)) {
      return gypPath
    }
  } catch (err) {
    // This method failed, hopefully the next will succeed...
  }

  // All of that failed, now look for it next to node itself.
  var nodeNpmPkgPath = path.resolve(process.execPath, '../../lib/node_modules/npm/')
  gypPath = path.join(nodeNpmPkgPath, 'node_modules/node-gyp/bin/node-gyp.js')
  if (fs.existsSync(gypPath)) {
    return gypPath
  }

  return null
}

function gypVersion() {
  var cmd = null
  var args = ['-v']
  var gyp = findNodeGyp()
  if (gyp) {
    args.unshift(gyp) // push_front
    cmd = process.execPath
  } else {
    cmd = IS_WIN ? 'node-gyp.cmd' : 'node-gyp'
  }

  var child = cp.spawnSync(cmd, args)
  var match = /v(\d+\.\d+\.\d+)/.exec(child.stdout)
  return match && match[1]
}

function execGyp(args, cb) {
  var cmd = null
  var gyp = findNodeGyp()
  if (gyp) {
    args.unshift(gyp) // push_front
    cmd = process.execPath
  } else {
    cmd = IS_WIN ? 'node-gyp.cmd' : 'node-gyp'
  }

  var spawnOpts = {}
  if (!opts.quiet) {
    spawnOpts.stdio = [0, 1, 2]
  }
  console.log('> ' + cmd + ' ' + args.join(' ')) // eslint-disable-line no-console

  var child = cp.spawn(cmd, args, spawnOpts)
  child.on('error', cb)
  child.on('close', function onGypClose(code) {
    if (code !== 0) {
      cb(new Error('Command exited with non-zero code: ' + code))
    } else {
      cb(null)
    }
  })
}

function build(target, rebuild, cb) {
  if (IS_WIN && HAS_OLD_NODE_GYP_ARGS_FOR_WINDOWS) {
    target = '/t:' + target
  }

  var cmds = rebuild ? ['clean', 'configure'] : ['configure']

  execGyp(cmds, function cleanCb(err) {
    if (err) {
      return cb(err)
    }

    var jobs = Math.round(CPU_COUNT / 2)
    execGyp(['build', '-j', jobs, target], cb)
  })
}

function moveBuild(target, cb) {
  var filePath = path.join(BUILD_PATH, target + '.node')
  var destination = path.join(BUILD_PATH, getBinFileName(target))
  fs.rename(filePath, destination, cb)
}

function download(target, cb) {
  var hasCalledBack = false
  var fileName = getPackageFileName(target)
  var url = DOWNLOAD_HOST + REMOTE_PATH + fileName

  if (DOWNLOAD_HOST.startsWith('https:')) {
    var client = https
  } else {
    console.log(
      'Falling back to http, please consider enabling SSL on ' + DOWNLOAD_HOST
    )
    var client = http
  }

  client.get(url, function getFile(res) {
     if (res.statusCode === 404) {
      return cb(new Error('No pre-built artifacts for your OS/architecture.'))
    } else if (res.statusCode !== 200) {
      return cb(new Error('Failed to download ' + url + ': code ' + res.statusCode))
    }

    var unzip = zlib.createGunzip()
    var buffers = []
    var size = 0
    res.pipe(unzip).on('data', function onResData(data) {
      buffers.push(data)
      size += data.length
    })

    res.on('error', function onResError(err) {
      if (!hasCalledBack) {
        hasCalledBack = true
        cb(new Error('Failed to download ' + url + ': ' + err.message))
      }
    })

    unzip.on('error', function onResError(err) {
      if (!hasCalledBack) {
        hasCalledBack = true
        cb(new Error('Failed to unzip ' + url + ': ' + err.message))
      }
    })

    unzip.on('end', function onResEnd() {
      if (hasCalledBack) {
        return
      }
      hasCalledBack = true
      cb(null, Buffer.concat(buffers, size))
    })

    res.resume()
  })
}

function saveDownload(target, data, cb) {
  makePath(BUILD_PATH, function makePathCB(err) {
    if (err) {
      return cb(err)
    }

    var filePath = path.join(BUILD_PATH, getBinFileName(target))
    fs.writeFile(filePath, data, cb)
  })
}

function install(target, cb) {
  var errors = []

  var noBuild = opts['no-build'] || process.env.NR_NATIVE_METRICS_NO_BUILD
  var noDownload = opts['no-download'] || process.env.NR_NATIVE_METRICS_NO_DOWNLOAD

  // If NR_NATIVE_METRICS_NO_BUILD env var is specified, jump straight to downloading
  if (noBuild) {
    return doDownload()
  }

  // Otherwise, first attempt to build the package using the source. If that fails, try
  // downloading the package. If that also fails, whoops!
  build(target, true, function buildCB(err) {
    if (!err) {
      return moveBuild(target, function moveBuildCB(err) {
        if (err) {
          errors.push(err)
          doDownload()
        } else {
          doCallback()
        }
      })
    }
    errors.push(err)

    // Building failed, try downloading.
    doDownload()
  })

  function doDownload() {
    if (noDownload && !noBuild) {
      return doCallback(new Error('Downloading is disabled.'))
    }

    download(target, function downloadCB(err, data) {
      if (err) {
        return doCallback(err)
      }

      saveDownload(target, data, doCallback)
    })
  }

  function doCallback(err) {
    if (err) {
      errors.push(err)
      cb(err)
    } else {
      cb()
    }
  }
}

function upload(target, cb) {
  // XXX This is the one external dep allowed by this module. The aws-sdk must
  // XXX be a dev-dep of the module and uploading should only be done after
  // XXX installing.

  var zip = zlib.createGzip()
  fs.createReadStream(path.join(BUILD_PATH, getBinFileName(target))).pipe(zip)

  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in the environment.
  var AWS = require('aws-sdk')
  var s3 = new AWS.S3()
  s3.upload({
    Bucket: S3_BUCKET,
    Key: path.join(REMOTE_PATH, getPackageFileName(target)),
    Body: zip
  }, function s3UploadCb(err) {
    if (err) {
      cb(new Error('Failed to upload file: ' + err.message))
    } else {
      cb()
    }
  })
}

function parseArgs(_argv, _opts) {
  var args = []
  for (var i = 0; i < _argv.length; ++i) {
    if (/^--/.test(_argv[i])) {
      _opts[_argv[i].substr(2)] = true
    } else {
      args.push(_argv[i])
    }
  }
  return args
}

function executeCli(cmd, target) {
  /* eslint-disable no-console */
  console.log(
    [
      '============================================================================',
      `Attempting ${cmd} in native-metrics module. Please note that this is an`,
      'OPTIONAL dependency, and any resultant errors in this process will not',
      'affect the general performance of the New Relic agent, but event loop and',
      'garbage collection metrics will not be collected.',
      '============================================================================',
      ''
    ].join('\n')
  )

  if (cmd === 'build' || cmd === 'rebuild') {
    build(target, cmd === 'rebuild', function buildCb(err) {
      if (err) {
        _endCli(err)
      } else {
        moveBuild(target, _endCli)
      }
    })
  } else if (cmd === 'install') {
    install(target, _endCli)
  } else if (cmd === 'upload') {
    upload(target, _endCli)
  }

  function _endCli(err) {
    if (err) {
      console.error(`Failed to execute native-metrics ${cmd}: ${err.message}`)
      process.exit(1)
    } else {
      console.log(cmd + ' successful: ' + _getFileName(target))
    }
  }
  /* eslint-enable no-console */
}
