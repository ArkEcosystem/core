'use strict'

module.exports = {
  initialization: {
    // receive(data, result, e) {
    //   camelizeColumns(data)
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

// function camelizeColumns(data) {
//     const tmp = data[0]
//     for (const prop in tmp) {
//         const camel = pgp.utils.camelize(prop)
//         if (!(camel in tmp)) {
//             for (let i = 0; i < data.length; i++) {
//                 const d = data[i]
//                 d[camel] = d[prop]
//                 delete d[prop]
//             }
//         }
//     }
// }
