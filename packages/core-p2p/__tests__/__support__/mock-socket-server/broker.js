const SCBroker = require('socketcluster/scbroker');
const scClusterBrokerClient = require('scc-broker-client');

class Broker extends SCBroker {
    run() {
        console.log(`   >> Mock Broker PID: ${process.pid}`);

        const options = this.options;

        if (options.clusterStateServerHost) {
            scClusterBrokerClient.attach(this, {
                stateServerHost: options.clusterStateServerHost,
                stateServerPort: options.clusterStateServerPort,
                mappingEngine: options.clusterMappingEngine,
                clientPoolSize: options.clusterClientPoolSize,
                authKey: options.clusterAuthKey,
                stateServerConnectTimeout: options.clusterStateServerConnectTimeout,
                stateServerAckTimeout: options.clusterStateServerAckTimeout,
                stateServerReconnectRandomness: options.clusterStateServerReconnectRandomness
            });
        }
    }
}

new Broker();