const events = require('events').EventEmitter;
const emitter = new events.EventEmitter()

 emitter.on('newEvent', function(user){
                console.log('data')
          //      return resolve()
            })


module.exports = emitter

