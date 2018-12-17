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

        if (opts.token && opts.network) {
            config = NetworkManager.findByName(opts.network, opts.token);
        } else {
            try {
                const networkPath = resolve(expandHomeDir(process.env.ARK_PATH_CONFIG));

                config = {
                    network: require(`${networkPath}/network`),
                    milestones: require(`${networkPath}/milestones`),
                    dynamicFees: require(`${networkPath}/dynamicFees`),
                };
            } catch (error) {
                config = false;
            }
        }

        const { error } = Joi.validate(config, schemaNetwork);

        if (error) {
            throw new Error(
                "An invalid network configuration was provided or is inaccessible due to it's security settings.",
            );
        }

        process.env.ARK_NETWORK_NAME = config.network.name;

        return config;
    }
}
