'use strict';

module.exports = {
  getPublicKey: {
    id: 'accounts.getPublicKey',
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
