const SCWorker = require('socketcluster/scworker');

class Worker extends SCWorker {
    run() {
        console.log(`   >> Mock Worker PID: ${process.pid}`);
        
        const scServer = this.scServer;

        const self = this

        /*
        In here we handle our incoming realtime connections and listen for events.
        */
        scServer.on('connection', function (socket) {

            self.registerEndpoints(socket)

            
            /*socket.on('disconnect', function () {
                    clearInterval(interval);
                });*/
        });

    }

    registerEndpoints(socket) {
        const self = this

        const peerHandlers = {
            getPeers: true,
            getHeight: true,
            getCommonBlocks: true,
            getTransactions: true,
            getStatus: true,
            postBlock: true,
            postTransactions: true,
            getBlocks: true,
        }
        for (const name of Object.keys(peerHandlers)) {
            socket.on(`p2p.peer.getStatus`, async (data, res) => res(null, {
                
                    "currentSlot": 7473975,
                    "forgingAllowed": true,
                    "header": {
                      "blockSignature": "304402202fe5de5697fa25d3d3c0cb24617ac02ddfb1c915ee9194a89f8392f948c6076402200d07c5244642fe36afa53fb2d048735f1adfa623e8fa4760487e5f72e17d253b",
                      "generatorPublicKey": "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
                      "height": 1,
                      "id": "17184958558311101492",
                      "idHex": "ee7d3cc24bf13434",
                      "numberOfTransactions": 153,
                      "payloadHash": "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
                      "payloadLength": 35960,
                      "previousBlockHex": "0000000000000000",
                      "reward": "0",
                      "timestamp": 0,
                      "totalAmount": "12500000000000000",
                      "totalFee": "0",
                      "version": 0,
                    },
                    "height": 1,
                    "success": true,
                 
            }) )
            socket.on(`p2p.peer.${name}`, async (data, res) => {} )
                //self.forwardToMaster(Object.assign(data, { endpoint: `p2p.peer.${name}` }), res))
        }
    }

}

new Worker();