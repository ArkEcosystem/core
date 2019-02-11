import scClusterBrokerClient from "scc-broker-client";
import SCBroker from "socketcluster/scbroker";

class Broker extends SCBroker {
    public run() {
        console.log(`   >> Broker PID: ${process.pid}`);

        // This is defined in server.js (taken from environment variable SC_CLUSTER_STATE_SERVER_HOST).
        // If this property is defined, the broker will try to attach itself to the SC cluster for
        // automatic horizontal scalability.
        // This is mostly intended for the Kubernetes deployment of SocketCluster - In this case,
        // The clustering/sharding all happens automatically.

        const options = (this as any).options;

        if (options.clusterStateServerHost) {
            scClusterBrokerClient.attach(this, {
                stateServerHost: options.clusterStateServerHost,
                stateServerPort: options.clusterStateServerPort,
                mappingEngine: options.clusterMappingEngine,
                clientPoolSize: options.clusterClientPoolSize,
                authKey: options.clusterAuthKey,
                stateServerConnectTimeout: options.clusterStateServerConnectTimeout,
                stateServerAckTimeout: options.clusterStateServerAckTimeout,
                stateServerReconnectRandomness: options.clusterStateServerReconnectRandomness,
            });
        }
    }
}

// tslint:disable-next-line
new Broker();
