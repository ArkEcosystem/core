const blockchain = require(__root + 'core/blockchainManager')
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

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
}

module.exports = new AccountsRepository
