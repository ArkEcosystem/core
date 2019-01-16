import { models } from "@arkecosystem/crypto";
import axios from "axios";
import { spawnSync } from "child_process";
import expandHomeDir from "expand-home-dir";
import { copySync, ensureDirSync, existsSync, writeFileSync } from "fs-extra";
import { resolve } from "path";

export class RemoteLoader {
    private remote: any;
    private config: any;

    constructor(variables) {
        this.remote = variables.remote;
        this.config = expandHomeDir(variables.config);

        ensureDirSync(this.config);
    }

    public async setUp() {
        const network = await this.configureNetwork();

        await this.configureExceptions();

        await this.configureMilestones();

        await this.configureGenesisBlock();

        await this.configurePeers();

        await this.configureDelegates();

        this.configurePlugins(network);

        this.configureDatabase(network);
    }

    private async configureNetwork() {
        const network = await this.getConfig("network");

        this.writeConfig("network", network);

        return network;
    }

    private async configureExceptions() {
        const exceptions = await this.getConfig("exceptions");

        this.writeConfig("exceptions", exceptions);

        return exceptions;
    }

    private async configureMilestones() {
        const milestones = await this.getConfig("milestones");

        this.writeConfig("milestones", milestones);

        return milestones;
    }

    private async configureGenesisBlock() {
        const { Block } = models;

        const genesisBlock = await this.getConfig("genesis-block");
        const genesisBlockModel = new Block(genesisBlock);

        if (!genesisBlockModel.verification.verified) {
            // tslint:disable-next-line:no-console
            console.error("Failed to verify the genesis block. Try another remote host.");
            process.exit(1);
        }

        this.writeConfig("genesisBlock", genesisBlock);
    }

    private async configurePeers() {
        const peers = await this.getConfig("peers");

        this.writeConfig("peers", peers);
    }

    private async configureDelegates() {
        const delegates = await this.getConfig("delegates");

        this.writeConfig("delegates", delegates);
    }

    private configurePlugins(network) {
        const plugins = resolve(__dirname, `../../core/src/config/${network.name}/plugins.js`);

        copySync(plugins, `${this.config}/plugins.js`);
    }

    private configureDatabase(network) {
        const command = spawnSync("createdb", [`core_${network.name}`]);

        if (command.stderr.length > 0) {
            // tslint:disable-next-line:no-console
            console.error(command.stderr.toString());
            process.exit(1);
        }

        // tslint:disable-next-line:no-console
        console.info(command.stdout.toString());
    }

    private async getConfig(type) {
        try {
            const { data } = await axios.get(`http://${this.remote}/config/${type}`, {
                headers: { "Content-Type": "application/json" },
            });

            return data.data;
        } catch (error) {
            if (!this.exists(type)) {
                // tslint:disable-next-line:no-console
                console.error(error.message);
                process.exit(1);
            }
        }
    }

    private writeConfig(file, data) {
        writeFileSync(`${this.config}/${file}.json`, JSON.stringify(data, null, 4));
    }

    private exists(file) {
        return existsSync(`${this.config}/${file}.json`);
    }
}
