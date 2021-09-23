var debug = require('debug')('snyk:config');
var nconf = require('nconf');
require('./nconf-truth');
var path = require('path');
var _ = require('lodash');

module.exports = function (dir, options) {
  if (!dir) {
    dir = '';
  }

  options = options || {};
  var secretConfig = options.secretConfig ||
                     path.resolve(dir, 'config.secret.json');

  if (!path.isAbsolute(dir)) {
    throw new Error('config requires absolute path to read from');
  }


  var snykMatch = /^SNYK_.*$/;

  nconf.env({
    separator: '__',
    match: snykMatch,
    whitelist: ['NODE_ENV', 'PORT'],
  });
  nconf.argv();
  nconf.file('secret', { file: path.resolve(secretConfig) });
  nconf.file('local', { file: path.resolve(dir, 'config.local.json') });
  nconf.file('default', { file: path.resolve(dir, 'config.default.json') });

  var config = nconf.get();

  // strip prefix from env vars in config
  Object.keys(config).forEach(function (key) {
    if (key.match(snykMatch)) {
      const trimmedKey = key.replace(/^SNYK_/, '');
      if (typeof config[trimmedKey] === 'object' &&
          typeof config[key] === 'object') {
        config[trimmedKey] = _.merge(config[trimmedKey], config[key]);
      } else {
        config[trimmedKey] = config[key];
      }
      delete config[key];
    }
  });

  substituteEnvVarValues(config);

  debug('loading from %s', dir, JSON.stringify(config, '', 2));

  return config;
};

// recursively replace ${VAL} in config values with process.env.VAL
function substituteEnvVarValues(config) {
  Object.keys(config).forEach(function (key) {
    // recurse through nested objects
    if (typeof config[key] === 'object') {
      return substituteEnvVarValues(config[key]);
    }

    // replace /\${.*?}/g in strings with env var if such exists
    if (typeof config[key] === 'string') {
      config[key] = config[key].replace(/(\${.*?})/g, function (_, match) {
        var val = match.slice(2, -1); // ditch the wrappers

        // explode if env var is missing
        if (process.env[val] === undefined) {
          throw new Error('Missing env var to substitute ' + val + ' in \'' +
                          key + ': "' + config[key] + '"\'');
        }

        return process.env[val];
      });
    }
  });
}
