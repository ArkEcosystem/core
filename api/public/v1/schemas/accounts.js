'use strict';

module.exports = {
  getPublickey: {
    id: 'accounts.getPublickey',
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1
      }
    },
    required: ['address']
  },

  getAccount: {
      id: 'accounts.getAccount',
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
