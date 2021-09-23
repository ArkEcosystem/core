var crypto = require('crypto');

function Hasher() {}

Hasher.prototype.hashToIndex = function (key, modulo) {
  var ch;
  var hash = key;

  for (var i = 0; i < key.length; i++) {
    ch = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  return Math.abs(hash || 0) % modulo;
};

Hasher.prototype.hashToHex = function (key, algorithm) {
  var hasher = crypto.createHash(algorithm || 'md5');
  hasher.update(key);
  return hasher.digest('hex');
};

module.exports = Hasher;
