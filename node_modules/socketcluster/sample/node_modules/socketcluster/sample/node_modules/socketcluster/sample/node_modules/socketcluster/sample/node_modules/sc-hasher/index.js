
module.exports.hash = function (key, modulo) {
  var ch;
  var result = 0;
  if (typeof key == 'number') {
    result = key;
  } else {
    if (key instanceof Array) {
      key = key[0];
    }
    if (typeof key != 'string') {
      try {
        key = JSON.stringify(key);
      } catch (e) {
        key = null;
      }
    }
    if (key == null || key.length == 0) {
      return result;
    }
    for (var i = 0; i < key.length; i++) {
      ch = key.charCodeAt(i);
      result = ((result << 5) - result) + ch;
      result = result & result;
    }
  }
  return Math.abs(result) % modulo;
};
