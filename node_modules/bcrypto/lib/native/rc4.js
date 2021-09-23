/*!
 * rc4.js - RC4 for javascript
 * Copyright (c) 2018-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcrypto
 */

'use strict';

const assert = require('../internal/assert');
const binding = require('./binding');

/**
 * RC4
 */

class RC4 {
  constructor() {
    this._handle = binding.rc4_create();
  }

  init(key) {
    assert(this instanceof RC4);
    assert(Buffer.isBuffer(key));

    binding.rc4_init(this._handle, key);

    return this;
  }

  encrypt(data) {
    assert(this instanceof RC4);
    assert(Buffer.isBuffer(data));

    binding.rc4_encrypt(this._handle, data);

    return data;
  }

  destroy() {
    assert(this instanceof RC4);

    binding.rc4_destroy(this._handle);

    return this;
  }
}

/*
 * Static
 */

RC4.native = 2;

/*
 * Expose
 */

module.exports = RC4;
