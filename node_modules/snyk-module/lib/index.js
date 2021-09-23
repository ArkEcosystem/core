module.exports = moduleToObject;
module.exports.encode = encode;

var debug = require('debug')('snyk:module');
var gitHost = require('hosted-git-info');

/**
 * Converts a string module name to an object
 * @param  {String} str     Required module name (can also include @version)
 * @param  {String} version Optional version
 * @param  {Object} options { loose: Boolean }
 * @return {Object}         Containing .name & .version properties
 */
function moduleToObject(str, version, options) {
  if (!str) {
    throw new Error('requires string to parse into module');
  }

  if (version && !options && typeof version === 'object') {
    options = version;
    version = null;
  }

  if (version && str.lastIndexOf('@') < 1) {
    debug('appending version onto string');
    str += '@' + version;
  }

  // first try with regular git urls
  var gitObject = looksLikeUrl(str);
  if (gitObject) {
    // then the string looks like a url, let's try to parse it
    return supported(str, fromGitObject(gitObject), options);
  }

  var parts = str.split('@');

  if (str.indexOf('@') === 0) {
    // put the scoped package name back together
    parts = parts.slice(1);
    parts[0] = '@' + parts[0];
  }

  // then as a backup, try pkg@giturl
  gitObject = parts[1] && looksLikeUrl(parts[1]);

  if (gitObject) {
    // then the string looks like a url, let's try to parse it
    return supported(str, fromGitObject(gitObject, parts[0]), options);
  }

  if (parts.length === 1) { // no version
    parts.push('*');
  }

  var module = {
    name: parts[0],
    version: parts.slice(1).join('@'),
  };

  return supported(str, module, options);
}

function looksLikeUrl(str) {
  if (str.slice(-1) === '/') {
    // strip the trailing slash since we can't parse it properly anyway
    str = str.slice(0, -1);
  }

  if (str.toLowerCase().indexOf('://github.com/') !== -1 &&
      str.indexOf('http') === 0) {
    // attempt to get better compat with our parser by stripping the github
    // and url parts
    // examples:
    // - https://github.com/Snyk/snyk/releases/tag/v1.14.2
    // - https://github.com/Snyk/vulndb/tree/snapshots
    // - https://github.com/Snyk/snyk/commit/75477b18
    var parts = str.replace(/https?:\/\/github.com\//, '').split('/');
    str = parts.shift() + '/' + parts.shift();

    if (parts.length) {
      str += '#' + parts.pop();
    }
  }

  var obj = gitHost.fromUrl(str);

  return obj;
}

function fromGitObject(obj) {
  var error = false;

  // debug('parsed from hosted-git-info');

  /* istanbul ignore if */
  if (!obj.project || !obj.user) {
    // this should never actually occur
    error = new Error('not supported: failed to fully parse');
    error.code = 501;
    throw error;
  }

  var module = {
    name: obj.project,
    version: obj.user + '/' + obj.project,
  };

  if (obj.committish) {
    module.version += '#' + obj.committish;
  }

  return module;
}

function encode(name) {
  return name[0] + encodeURIComponent(name.slice(1));
}

function supported(str, module, options) {
  if (!options) {
    options = {};
  }

  var error;

  if (options.packageManager === 'maven') {
    if (str.indexOf(':') === -1) {
      throw new Error('invalid Maven package name: ' + str);
    }
    return module;
  }

  var protocolMatch = module.version.match(/^(https?:)|(git[:+])/i);
  if (protocolMatch ||
      module.name.indexOf('://') !== -1) {
    // we don't support non-npm modules atm
    debug('not supported %s@%s (ext)', module.name, module.version);
    if (options.loose) {
      delete module.version;
    } else {
      debug('external module: ' + toString(module));
    }
  }

  if (error) {
    error.code = 501; // not implemented
    throw error;
  }

  if (module.version === 'latest' || !module.version) {
    module.version = '*';
  }

  debug('%s => { name: "%s", version: "%s" }',
    str, module.name, module.version);

  return module;
}

function toString(module) {
  return module.name + '@' + module.version;
}

/* istanbul ignore if */
if (!module.parent) {
  // support simple cli testing
  console.log(moduleToObject(process.argv[2], { loose: false }));
}
