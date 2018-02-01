const chainInstance = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const _ = require('lodash')

exports.blockchain = {
  handler: (request, h) => {
    const lastBlock = chainInstance.status.lastBlock

    const height = lastBlock.data.height
    const initialSupply = config.genesisBlock.totalAmount / 10 ** 8

    const constants = config.getConstants(height)
    const rewardPerBlock = constants.reward / 10 ** 8

    const totalSupply = config.genesisBlock.totalAmount + (lastBlock.data.height - constants.height) * constants.reward

    return db.delegates.active(height, totalSupply).then((delegates) => {
      const delegatesByProductivity = _.sortBy(delegates, 'productivity')

      return h.response({
        data: {
          supply: {
            initial: initialSupply * 10 ** 8,
            current: (initialSupply + ((height - config.getConstants(height).height) * rewardPerBlock)) * 10 ** 8
          },
          blocks: {
            forged: height,
            rewards: height * rewardPerBlock
          },
          rewards: {
            start: constants.height,
            total: height * rewardPerBlock
          },
          productivity: {
            best: delegatesByProductivity[0],
            worst: delegatesByProductivity.reverse()[0]
          }
        }
      })
    })
  }
}

exports.transactions = {
  handler: (request, h) => {
    return db.transactions
      .findAllByDateAndType(0, request.query.from, request.query.to)
      .then(blocks => ({
        data: {
          count: blocks.count,
          amount: _.sumBy(blocks.rows, 'amount'),
          fees: _.sumBy(blocks.rows, 'fee')
        }
      }))
  }
}

exports.blocks = {
  handler: (request, h) => {
    return db.blocks
      .findAllByDateTimeRange(request.query.from, request.query.to)
      .then(blocks => ({
        data: {
          count: blocks.count,
          rewards: _.sumBy(blocks.rows, 'reward'),
          fees: _.sumBy(blocks.rows, 'totalFee')
        }
      }))
  }
}

exports.votes = {
  handler: (request, h) => {
    return db.transactions
      .findAllByDateAndType(3, request.query.from, request.query.to)
      .then(transactions => transactions.rows.filter(v => v.asset.votes[0].startsWith('+')))
      .then(transactions => ({
        data: {
          count: transactions.length,
          amount: _.sumBy(transactions.rows, 'amount'),
          fees: _.sumBy(transactions, 'fee')
        }
      }))
  }
}

exports.unvotes = {
  handler: (request, h) => {
    return db.transactions
      .findAllByDateAndType(3, request.query.from, request.query.to)
      .then(transactions => transactions.rows.filter(v => v.asset.votes[0].startsWith('-')))
      .then(transactions => ({
        data: {
          count: transactions.length,
          amount: _.sumBy(transactions.rows, 'amount'),
          fees: _.sumBy(transactions, 'fee')
        }
      }))
  }
}
