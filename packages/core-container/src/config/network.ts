import { NetworkManager } from "@arkecosystem/crypto";
import expandHomeDir from "expand-home-dir";
import { resolve } from "path";

export class Network {
    /**
     * Export all network variables for the core environment.
     * @return {void}
     */
    public static setUp(variables: any) {
        let config;

        if (variables.token && variables.network) {
            config = NetworkManager.findByName(variables.network, variables.token);
        } else {
            try {
                const networkPath = resolve(expandHomeDir(`${process.env.ARK_PATH_CONFIG}/network`));

                config = require(networkPath);
            } catch (error) {
                config = false;
            }
        }

        if (!config) {
            throw new Error(
                "An invalid network configuration was provided or is inaccessible due to it's security settings.",
            );
        }

        process.env.ARK_NETWORK_NAME = config.network.name;

        return config;
    }
}
