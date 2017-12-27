'use strict';

module.exports = {
  getPublicKey: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1
      }
    },
    required: ['address']
  }
}
