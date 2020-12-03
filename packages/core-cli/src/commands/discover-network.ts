import { Networks } from "@arkecosystem/crypto";
import { existsSync, readdirSync, readJSON } from "fs-extra";
import { join } from "path";
import prompts from "prompts";

import { injectable } from "../ioc";

/**
 * @export
 * @class DiscoverNetwork
 */
@injectable()
export class DiscoverNetwork {
    /**
     * @param {string} path
     * @returns {Promise<string>}
     * @memberof DiscoverNetwork
     */
    public async discover(path: string): Promise<string> {
        try {
            return await this.discoverFromCrypto();
        } catch {}

        if (!existsSync(path)) {
            throw new Error(`The [${path}] directory does not exist.`);
        }

        const folders: string[] = readdirSync(path).filter((folder) => this.isValidNetwork(folder));

        if (!folders || folders.length === 0) {
            throw new Error(
                'We were unable to detect a network configuration. Please run "ark config:publish" and try again.',
            );
        }

        if (folders.length === 1) {
            return folders[0];
        }

        return this.discoverWithPrompt(folders);
    }

    public async discoverFromCrypto(): Promise<string> {
        const network = await readJSON(join(process.env.CORE_PATH_CONFIG!, "crypto", "network.json"));

        return network.name;
    }

    /**
     * @param {string[]} folders
     * @returns {Promise<string>}
     * @memberof DiscoverNetwork
     */
    public async discoverWithPrompt(folders: string[]): Promise<string> {
        const response = await prompts([
            {
                type: "select",
                name: "network",
                message: "What network do you want to operate on?",
                choices: folders
                    .filter((folder) => this.isValidNetwork(folder))
                    .map((folder) => ({ title: folder, value: folder })),
            },
            {
                type: "confirm",
                name: "confirm",
                message: "Can you confirm?",
            },
        ]);

        if (!response.confirm) {
            throw new Error("You'll need to confirm the network to continue.");
        }

        if (!this.isValidNetwork(response.network)) {
            throw new Error(`The given network "${response.network}" is not valid.`);
        }

        return response.network;
    }

    private isValidNetwork(network: string): boolean {
        return Object.keys(Networks).includes(network);
    }
}
