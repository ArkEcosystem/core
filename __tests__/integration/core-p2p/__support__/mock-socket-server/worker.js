const delay = require("delay")
const SCWorker = require('socketcluster/scworker');

class Worker extends SCWorker {
    run() {
        console.log(`   >> Mock Worker PID: ${process.pid}`);
        
        this.mocks = [];

        /*
        In here we handle our incoming realtime connections and listen for events.
        */
        this.scServer.on('connection', (socket) => {
            this.registerEndpoints(socket)
        });
    }

    registerEndpoints(socket) {
        socket.on(`mock.add`, async (data, res) => {
            this.mocks.push(data.endpoint)
            socket.on(data.endpoint, async (d, r) => r(null, data.value))
            res()
        })

        socket.on(`mock.timeout`, async (data, res) => {
            socket.on(data.endpoint, async (d, r) => {
                setTimeout(() => r(new Error("Timeout")), data.timeout)
            })
            res()
        })

        socket.on(`mock.reset`, async (data, res) => {
            socket.off(data.endpoint)
            res()
        })

        socket.on(`mock.resetAll`, async (data, res) => {
            for (const mockEndpoint of this.mocks) {
                socket.off(mockEndpoint)
            }
            this.mocks = []
            res()
        })

    }

}

new Worker();