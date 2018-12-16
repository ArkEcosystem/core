import { FileLoader, RemoteLoader } from "./loaders";

export const plugin = {
    pkg: require("../package.json"),
    alias: "config",
    async register(container, options) {
        const variables = container.variables;

        // Check if we need to retrieve remote configuration files!
        if (variables.remote) {
            const remoteLoader = new RemoteLoader(variables);
            await remoteLoader.setUp();
        }

        // Load the local configuration files
        const loader = new FileLoader();
        await loader.setUp(options);

        return loader;
    },
};
