import { ensureDirSync, existsSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import { dirSync } from "tmp";

import { CryptoConfigPaths } from "../contracts";
import { Generator } from "./generator";

export class CryptoGenerator extends Generator {
    /**
     * @private
     * @type {string}
     * @memberof CoreGenerator
     */
    private destination!: string;

    /**
     * @returns {CoreConfigPaths}
     * @memberof CoreGenerator
     */
    public generate(): CryptoConfigPaths {
        this.destination = resolve(__dirname, `${dirSync().name}/${this.options.crypto.flags.network}`);

        if (existsSync(this.destination)) {
            throw new Error(`${this.destination} already exists.`);
        }

        ensureDirSync(this.destination);

        this.writeExceptions();

        this.writeGenesisBlock();

        this.writeMilestones();

        this.writeNetwork();

        return {
            root: this.destination,
            exceptions: resolve(this.destination, "exceptions.json"),
            genesisBlock: resolve(this.destination, "genesisBlock.json"),
            milestones: resolve(this.destination, "milestones.json"),
            network: resolve(this.destination, "network.json"),
        };
    }

    /**
     * @private
     * @memberof CryptoGenerator
     */
    private writeExceptions(): void {
        const filePath: string = resolve(this.destination, "exceptions.json");

        writeJSONSync(filePath, this.cryptoManager.NetworkConfigManager.get("exceptions"), {
            spaces: 4,
        });
    }

    /**
     * @private
     * @memberof CryptoGenerator
     */
    private writeGenesisBlock(): void {
        const filePath: string = resolve(this.destination, "genesisBlock.json");

        writeJSONSync(filePath, this.cryptoManager.NetworkConfigManager.get("genesisBlock"), {
            spaces: 4,
        });
    }

    /**
     * @private
     * @memberof CryptoGenerator
     */
    private writeMilestones(): void {
        const filePath: string = resolve(this.destination, "milestones.json");

        writeJSONSync(filePath, this.cryptoManager.NetworkConfigManager.get("milestones"), {
            spaces: 4,
        });
    }

    /**
     * @private
     * @memberof CryptoGenerator
     */
    private writeNetwork(): void {
        const filePath: string = resolve(this.destination, "network.json");

        writeJSONSync(filePath, this.cryptoManager.NetworkConfigManager.get("network"), { spaces: 4 });
    }
}
