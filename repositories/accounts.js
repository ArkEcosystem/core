const blockchain = require(__root + 'core/blockchainManager')
const Op = require('sequelize').Op

class AccountsRepository {
    constructor() {
        this.db = blockchain.getInstance().getDb()
    }

    paginate(params, page, perPage) {
        return this.db.accounts.findAndCountAll(Object.assign(params, {
            offset: page * perPage,
            limit: perPage,
        }))
    }

    findById(id) {
        return this.db.accounts.findOne({
            where: {
                [Op.or]: [{
                    address: id,
                }, {
                    publicKey: id,
                }, {
                    username: id,
                }]
            }
        })
    }

    paginateDelegates(params, page, perPage) {
        return this.db.accounts.findAndCountAll(Object.assign(params, {
            where: {
                username: {
                    [Op.ne]: null
                },
            },
            offset: page * perPage,
            limit: perPage,
        }))
    }

    findDelegateById(id) {
        return this.db.accounts.findOne({
            where: {
                username: {
                    [Op.ne]: null
                },
                [Op.or]: [{
                    address: id,
                }, {
                    publicKey: id,
                }, {
                    username: id,
                }]
            }
        })
    }
}

module.exports = new AccountsRepository
