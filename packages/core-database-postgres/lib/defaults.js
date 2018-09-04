'use strict'

// const humps = require('humps')

module.exports = {
  initialization: {
    // receive: function (data) {
    //   camelizeColumnNames(data)
    // }
  },
  connection: {
    host: process.env.ARK_DB_HOST || 'localhost',
    port: process.env.ARK_DB_PORT || 5432,
    database: process.env.ARK_DB_USERNAME || `ark_${process.env.ARK_NETWORK_NAME}`,
    user: process.env.ARK_DB_PASSWORD || 'ark',
    password: process.env.ARK_DB_DATABASE || 'password'
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  }
}

// function camelizeColumnNames (data) {
//   const template = data[0]

//   for (const prop in template) {
//     const camel = humps.camelize(prop)

//     if (!(camel in template)) {
//       for (let i = 0; i < data.length; i++) {
//         const d = data[i]
//         d[camel] = d[prop]
//         delete d[prop]
//       }
//     }
//   }
// }
