import { FileLoader, RemoteLoader } from "./loaders";
import { Network } from "./network";

export class Config {
    public static async setUp(variables, options) {
        // Check if we need to retrieve remote configuration files!
        if (variables.remote) {
            const remoteLoader = new RemoteLoader(variables);
            await remoteLoader.setUp();
        }

        // Setup the network based on the CLI input
        const network = Network.setUp(variables);

        // Load the local configuration files
        const loader = new FileLoader();
        // TODO: remove network from here
        await loader.setUp(network, options);

        return loader;
    }
}
