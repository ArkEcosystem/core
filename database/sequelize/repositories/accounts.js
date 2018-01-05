const Op = require('sequelize').Op

class AccountsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.accountsTable.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.all(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.accountsTable.findOne({
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

  //Helper methods
  getDelegateInfo(address){
    delegate = db.localaccounts[address]

    //get produced blocks

    //get missed blocks

    //calc productivity

    //get rank


  }
}

module.exports = AccountsRepository
