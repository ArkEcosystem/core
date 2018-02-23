const { Model } = require('objection')
const pick = require('lodash/pick')

const logger = require('app/core/logger')

module.exports = class Block extends Model {
  static get tableName () {
    return 'blocks'
  }

  static relationMappings () {
    return {
      generator: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Wallet`,
        join: {
          from: 'blocks.generatorPublicKey',
          to: 'wallets.publicKey'
        }
      },
      transactions: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Transaction`,
        join: {
          from: 'blocks.id',
          to: 'transactions.blockId'
        }
      },
      serializedTransactions: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Transaction`,
        filter: query => query.select('serialized'),
        join: {
          from: 'blocks.id',
          to: 'transactions.blockId'
        }
      }
    }
  }

  static async findOrInsert (data) {
    let row = await this.query().where({ id: data.id, height: data.height }).first()

    if (!row) {
      const insert = await this.query().insert(pick(data, this.fillable))
      row = await this.query().where('id', insert.id).first()
    }

    return row
  }

  static async batchInsert (data) {
    try {
      const rows = data.map(d => pick(d, this.fillable))

      return this.knex().transaction((trx) => this.knex().batchInsert(this.tableName, rows).transacting(trx))
    } catch (error) {
      logger.error(error.stack)
      process.exit()
    }
    // return Promise.all(data.map((d) => this.findOrInsert(d)))
  }

  static get fillable () {
    return [
      'id',
      'version',
      'timestamp',
      'previousBlock',
      'height',
      'numberOfTransactions',
      'totalAmount',
      'totalFee',
      'reward',
      'payloadLength',
      'payloadHash',
      'generatorPublicKey',
      'blockSignature'
    ]
  }

  $beforeInsert () {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate () {
    this.updated_at = new Date().toISOString();
  }
}
