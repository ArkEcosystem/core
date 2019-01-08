/**
 * The AJV schema for the signature endpoints.
 * @type {Object}
 */
module.exports = {
  getFee: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address',
      },
    },
    required: ['address'],
  },
}
