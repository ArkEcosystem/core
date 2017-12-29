'use strict';

const config = requireFrom('core/config').constants;

module.exports = {
  enableForging: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['secret']
  },
  disableForging: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['secret']
  },
  forgingStatus: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['publicKey']
  },
  getDelegate: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string'
      },
      username: {
        type: 'string'
      }
    }
  },
  search: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        minLength: 1,
        maxLength: 20
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100
      }
    },
    required: ['q']
  },
  getVoters: {
    type: 'object',
    properties: {
      publicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['publicKey']
  },
  getDelegates: {
    type: 'object',
    properties: {
      orderBy: {
        type: 'string'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: constants.activeDelegates
      },
      offset: {
        type: 'integer',
        minimum: 0
      }
    }
  },
  getForgedByAccount: {
    type: 'object',
    properties: {
      generatorPublicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['generatorPublicKey']
  },
  addDelegate: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      },
      secondSecret: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      username: {
        type: 'string'
      }
    },
    required: ['secret']
  }
};
