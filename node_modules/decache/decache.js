var path = require('path'); // if module is locally defined we path.resolve it
var find = require('find'); // https://www.npmjs.com/package/find

require.getRootDir = function () {
  var keys = Object.keys(require.cache);
  var parent = keys[0]; // the module that required decache
  /* istanbul ignore else  */
  if(parent.indexOf('node_modules') > -1) {
    var end = parent.indexOf('node_modules');
    parent = parent.substring(0, end);
  } else {
    parent = path.resolve(path.normalize(parent +'../../..')); // resolve up!
  }
  return parent;
}

require.find = function (moduleName) {
  var parent = require.getRootDir();
  // a locally defined module
  if(moduleName.indexOf('/') > -1) {
    // console.log("BEFORE: "+moduleName);
    var last = moduleName.lastIndexOf('/');
    // strip everything before the forward slash
    moduleName = moduleName.substring(last, moduleName.length).replace('/', '');
    // console.log('AFTER: '+moduleName);

    var mod;
    var ext = path.extname(moduleName);
    if(ext === '') {
      mod = moduleName + '\.js'; // append .js to file type by default
    }
    else {
      mod = moduleName.replace(ext, '\\' + ext); // escape extension for regex
    }

    var re = new RegExp(mod,"g"); // regex to use when finding the file
    var files = find.fileSync(re, parent);
    var file;
    var keys = Object.keys(require.cache);
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if(keys.indexOf(f) > -1) { // won't this *always* be true?
        file = f;
        break;
      }
    }
    return file;
  } else {
    return moduleName;
  }
}

/**
 * Removes a module from the cache. We need this to re-load our http_request !
 * see: http://stackoverflow.com/a/14801711/1148249
 */
require.decache = function (moduleName) {

    moduleName = require.find(moduleName);

    if(!moduleName) {return;}

    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};

/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache no else so #ignore else http://git.io/vtgMI
    /* istanbul ignore else  */
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};

module.exports = require.decache;
