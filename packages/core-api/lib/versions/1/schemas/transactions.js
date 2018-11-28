/**
 * The AJV schema for the transaction endpoints.
 * @type {Object}
 */
module.exports = {
  getTransactions: {
    type: 'object',
    properties: {
      blockId: {
        type: 'string',
      },
      limit: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
      },
      type: {
        type: 'integer',
        minimum: 0,
        maximum: 10,
      },
      orderBy: {
        type: 'string',
      },
      offset: {
        type: 'integer',
        minimum: 0,
      },
      senderPublicKey: {
        type: 'string',
        format: 'publicKey',
      },
      vendorField: {
        type: 'string',
        format: 'vendorField',
      },
      ownerPublicKey: {
        type: 'string',
        format: 'publicKey',
      },
      ownerAddress: {
        type: 'string',
      },
      senderId: {
        type: 'string',
        format: 'address',
      },
      recipientId: {
        type: 'string',
        format: 'address',
      },
      amount: {
        type: 'integer',
        minimum: 0,
        maximum: 10 ** 8,
      },
      fee: {
        type: 'integer',
        minimum: 0,
        maximum: 10 ** 8,
      },
    },
  },
  getTransaction: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['id'],
  },
  getUnconfirmedTransaction: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['id'],
  },
  getUnconfirmedTransactions: {
    type: 'object',
    properties: {
      senderPublicKey: {
        type: 'string',
        format: 'publicKey',
      },
      address: {
        type: 'string',
      },
    },
  },
}
