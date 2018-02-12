const Sequelize = require('sequelize')

function syncTables(db) {
  const blocks = db.define('blocks', {
    id: {
      type: Sequelize.STRING(64),
      primaryKey: true
    },
    version: Sequelize.SMALLINT,
    timestamp: Sequelize.INTEGER,
    previousBlock: Sequelize.STRING(64),
    height: Sequelize.INTEGER,
    numberOfTransactions: Sequelize.INTEGER,
    totalAmount: Sequelize.BIGINT,
    totalFee: Sequelize.BIGINT,
    reward: Sequelize.BIGINT,
    payloadLength: Sequelize.INTEGER,
    payloadHash: Sequelize.STRING(64),
    generatorPublicKey: Sequelize.STRING(66),
    blockSignature: Sequelize.STRING(256)
  }, {
    indexes: [{
      unique: true,
      fields: ['id']
    }, {
      unique: true,
      fields: ['height']
    }, {
      fields: ['generatorPublicKey']
    }]
  })

  const transactions = db.define('transactions', {
    id: {
      type: Sequelize.STRING(64),
      primaryKey: true
    },
    version: Sequelize.SMALLINT,
    blockId: {
      type: Sequelize.STRING(64),
      references: {
        model: blocks,
        key: 'id'
      }
    },
    timestamp: Sequelize.INTEGER,
    senderPublicKey: Sequelize.STRING(66),
    recipientId: Sequelize.STRING(36),
    type: Sequelize.SMALLINT,
    vendorFieldHex: Sequelize.BLOB,
    amount: Sequelize.BIGINT,
    fee: Sequelize.BIGINT,
    serialized: Sequelize.BLOB
  }, {
    indexes: [{
      unique: true,
      fields: ['id']
    }, {
      fields: ['senderPublicKey']
    }, {
      fields: ['recipientId']
    }, {
      fields: ['vendorFieldHex']
    }, {
      fields: ['timestamp']
    }]
  })
  transactions.belongsTo(blocks)
  blocks.hasMany(transactions)

  const wallets = db.define('wallets', {
    address: {
      type: Sequelize.STRING(36),
      primaryKey: true
    },
    publicKey: Sequelize.STRING(66),
    secondPublicKey: Sequelize.STRING(66),
    vote: Sequelize.STRING(66),
    username: Sequelize.STRING(64),
    balance: Sequelize.BIGINT,
    votebalance: Sequelize.BIGINT
  }, {
    indexes: [{
      unique: true,
      fields: ['address']
    }, {
      unique: true,
      fields: ['publicKey']
    }, {
      fields: ['vote']
    }, {
      fields: ['username']
    }]
  })

  const rounds = db.define('rounds', {
    publicKey: {
      type: Sequelize.STRING(66)
    },
    balance: Sequelize.BIGINT,
    round: Sequelize.BIGINT
  }, {
    uniqueKeys: {
      rounds_unique: {
        fields: ['publicKey', 'round']
      }
    },
    indexes: [{
      fields: ['publicKey']
    }, {
      fields: ['round']
    }]
  })

  const webhooks = db.define('webhooks', {
    event: Sequelize.STRING,
    target: Sequelize.STRING,
    conditions: Sequelize.JSON,
    secret: Sequelize.STRING,
    enabled: Sequelize.BOOLEAN
  }, {
    indexes: [{
      fields: ['event']
    }]
  })

  return Promise.all([blocks, transactions, wallets, rounds, webhooks].map(table => table.sync()))
}

module.exports = {
  syncTables
}
