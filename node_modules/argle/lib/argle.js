var isFunction = require('lodash.isfunction');
var isNumber = require('lodash.isnumber');

/* Public */

function shift(stuff, options, detect) {
  if (isFunction(options)) {
    detect = options;
  }

  if (!options) {
    options = {};
  }

  var arr = stuff.concat();
  var len = stuff.length;
  var hit = 0;

  if (Array.isArray(options)) {
    options = { defaults: options }
  }

  var def = options.defaults || [];
  var max = options.match || 1;
  var cnt = options.count;
  var tck = def.length;

  if (isNumber(cnt)) {
    while (len < cnt) {
      arr.unshift(def[--tck]);
      len = arr.length;
    }
  }

  for (var i = --len; i >= 0; --i) {
    var ele = arr[i];
    if (detect(ele)) {
      if (++hit >= max) {
        while (--hit > 0) {
          arr[len--] = arr[i + hit];
        }
        arr[len--] = ele;
        while (len >= i) {
          arr[len--] = def[--tck];
        }
        break;
      }
    } else if (ele) {
      break;
    } else {
      hit = 0;
    }
  }

  return arr;
}

/* Exports */

module.exports.shift = shift;
