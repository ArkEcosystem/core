import { NetworkManager } from "@arkecosystem/crypto";
import expandHomeDir from "expand-home-dir";
import Joi from "joi";
import { resolve } from "path";
import { schemaNetwork } from "./schema";

export class Network {
    /**
     * Expose information about the for the operating network to the environment.
     * @return {void}
     */
    public static setUp(opts: any) {
        let config;

        // Default configuration...
        if (opts.network) {
            config = NetworkManager.findByName(opts.network);
        } else {
            try {
                const networkPath = resolve(expandHomeDir(process.env.CORE_PATH_CONFIG));

                config = {
                    exceptions: require(`${networkPath}/exceptions`),
                    milestones: require(`${networkPath}/milestones`),
                    genesisBlock: require(`${networkPath}/genesisBlock`),
                    network: require(`${networkPath}/network`),
                };
            } catch (error) {
                config = false;
            }
        }

        // Validate the configuration...
        const { error } = Joi.validate(config, schemaNetwork);

        if (error) {
            throw new Error(
                `An invalid network configuration was provided or is inaccessible due to it's security settings. ${
                    error.message
                }.`,
            );
        }

        process.env.CORE_NETWORK_NAME = config.network.name;

        return config;
    }
}
