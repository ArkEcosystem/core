const goofy = require('app/core/goofy')
const Bull = require('bull')

let instance

module.exports = class Queue {
  constructor (config) {
    if (!instance) {
      goofy.debug('Queue has been instantiated.');

      instance = this
    } else {
      goofy.debug('Queue already instantiated.');
    }

    this.config = Object.keys(config).forEach((key) => (config[key] == null) && delete config[key])

    return instance
  }

  static getInstance () {
    return instance
  }

  connection (connection) {
    return new Bull(connection, { redis: this.config })
  }
}

// USAGE INSTRUCTIONS
// const queue = require('app/core/queue')
// const blockQueue = queue.getInstance().connection('blocks')

// blockQueue.empty()

// blockQueue.process((job, done) => done())

// blockQueue.add({ block_id: 1 })
// blockQueue.add({ block_id: 2 })
// blockQueue.add({ block_id: 3 })
// blockQueue.add({ block_id: 4 })
// blockQueue.add({ block_id: 5 })

// blockQueue.getCompleted().then((jobs) => console.log(`We left off at Block #${jobs[0].data.block_id}`))

// blockQueue.on('global:completed', (jobId) => {
//   blockQueue.getJob(jobId).then((job) => console.log(`Processed Block #${job.data.block_id}`))
// })
