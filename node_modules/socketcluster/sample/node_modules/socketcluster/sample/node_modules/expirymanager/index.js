var ExpiryManager = module.exports.ExpiryManager = function () {
  this._keys = {};
  this._expiries = {};
};

ExpiryManager.prototype._isEmpty = function (obj) {
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      return false;
    }
  }
  return true;
};

ExpiryManager.prototype._simplifyKey = function (key) {
  if (key instanceof Array) {
    // Use escape sequence to delimit array
    return '\\u001b' + key.join('\\u001b');
  }
  return key;
};

ExpiryManager.prototype._expandKey = function (key) {
  var regex = /^\\u001b/;
  if (regex.test(key)) {
    return key.replace(regex, '').split('\\u001b');
  }
  return key;
};

ExpiryManager.prototype.now = function () {
  return Math.round((new Date()).getTime() / 1000);
};

ExpiryManager.prototype.expire = function (keys, seconds) {
  this.unexpire(keys);
  var expiry = this.now() + seconds;
  var len = keys.length;
  var key;
  for (var i = 0; i < len; i++) {
    key = this._simplifyKey(keys[i]);
    this._keys[key] = expiry;
    if (this._expiries[expiry] == null) {
      this._expiries[expiry] = {};
    }
    this._expiries[expiry][key] = 1;
  }
};

ExpiryManager.prototype.unexpire = function (keys) {
  var len = keys.length;
  var expiry, key;
  for (var i = 0; i < len; i++) {
    key = this._simplifyKey(keys[i]);
    expiry = this._keys[key];
    delete this._keys[key];
    if (expiry && this._expiries[expiry] != null) {
      delete this._expiries[expiry][key];
      if (this._isEmpty(this._expiries[expiry])) {
        delete this._expiries[expiry];
      }
    }
  }
};

ExpiryManager.prototype.getExpiry = function (key) {
  key = this._simplifyKey(key);
  return this._keys[key];
};

ExpiryManager.prototype.getKeysByExpiry = function (expiry) {
  var keys = [];
  var keyMap = this._expiries[expiry];
  for (var i in keyMap) {
    if (keyMap.hasOwnProperty(i)) {
      keys.push(this._expandKey(i));
    }
  }
  return keys;
};

ExpiryManager.prototype.getExpiredKeys = function (time) {
  var expiredKeys = [];
  var now = time || this.now();
  var expiries = this._expiries;
  
  for (var i in expiries) {
    if (expiries.hasOwnProperty(i)) {
      if (i <= now) {
        for (var j in expiries[i]) {
          if (expiries[i].hasOwnProperty(j)) {
            expiredKeys.push(this._expandKey(j));
          }
        }
      } else {
        break;
      }
    }
  }
  return expiredKeys;
};

ExpiryManager.prototype.extractExpiredKeys = function (time) {
  var expiredKeys = this.getExpiredKeys(time);
  this.unexpire(expiredKeys);
  return expiredKeys;
};

ExpiryManager.prototype.clear = function () {
  this._keys = {};
  this._expiries = {};
};