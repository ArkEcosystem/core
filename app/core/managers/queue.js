const Bull = require('bull')

let instance

module.exports = class QueueManager {
  constructor (config) {
    this.config = config

    if (!instance) instance = this

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
// const queue = require('app/core/managers/queue')
// const blockQueue = queue.getInstance().connection('blocks')

// blockQueue.empty()

// blockQueue.process((job, done) => done())

// blockQueue.add({ block_id: 1 })
// blockQueue.add({ block_id: 2 })
// blockQueue.add({ block_id: 3 })
// blockQueue.add({ block_id: 4 })
// blockQueue.add({ block_id: 5 })

// const jobs = await blockQueue.getCompleted()
// console.log(`We left off at Block #${jobs[0].data.block_id}`)

// blockQueue.on('global:completed', async (jobId) => {
//   const job = await blockQueue.getJob(jobId)
//   console.log(`Processed Block #${job.data.block_id}`)
// })
