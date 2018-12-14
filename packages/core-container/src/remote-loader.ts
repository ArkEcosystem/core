import { models } from "@arkecosystem/crypto";
import axios from "axios";
import { spawnSync } from "child_process";
import expandHomeDir from "expand-home-dir";
import { copySync, ensureDirSync, existsSync, writeFileSync } from "fs-extra";
import { resolve } from "path";

export class RemoteLoader {
    private remote: any;
    private config: any;
    private data: any;

    constructor(variables) {
        this.remote = variables.remote;
        this.config = expandHomeDir(variables.config);
        this.data = expandHomeDir(variables.data);

        ensureDirSync(this.config);
    }

    public async setUp() {
        const network = await this.__configureNetwork();

        await this.__configureGenesisBlock();

        await this.__configurePeers();

        await this.__configureDelegates();

        this.__configurePlugins(network);

        this.__configureDatabase(network);
    }

    public async __configureNetwork() {
        const network = await this.__getConfig("network");

        this.__writeConfig("network", network);

        return network;
    }

    public async __configureGenesisBlock() {
        const { Block } = models;

        const genesisBlock = await this.__getConfig("genesis-block");
        const genesisBlockModel = new Block(genesisBlock);

        if (!genesisBlockModel.verification.verified) {
            // tslint:disable-next-line:no-console
            console.error("Failed to verify the genesis block. Try another remote host.");
            process.exit(1);
        }

        this.__writeConfig("genesisBlock", genesisBlock);
    }

    public async __configurePeers() {
        const peers = await this.__getConfig("peers");

        this.__writeConfig("peers", peers);
    }

    public async __configureDelegates() {
        const delegates = await this.__getConfig("delegates");

        this.__writeConfig("delegates", delegates);
    }

    public __configurePlugins(network) {
        const plugins = resolve(__dirname, `../../core/src/config/${network.name}/plugins.js`);

        copySync(plugins, `${this.config}/plugins.js`);
    }

    public __configureDatabase(network) {
        const command = spawnSync("createdb", [`ark_${network.name}`]);

        if (command.stderr.length > 0) {
            // tslint:disable-next-line:no-console
            console.error(command.stderr.toString());
            process.exit(1);
        }

        // tslint:disable-next-line:no-console
        console.info(command.stdout.toString());
    }

    public async __getConfig(type) {
        try {
            const { data } = await axios.get(`http://${this.remote}/config/${type}`, {
                headers: { "Content-Type": "application/json" },
            });

            return data.data;
        } catch (error) {
            if (!this.__exists(type)) {
                // tslint:disable-next-line:no-console
                console.error(error.message);
                process.exit(1);
            }
        }
    }

    public __writeConfig(file, data) {
        writeFileSync(`${this.config}/${file}.json`, JSON.stringify(data, null, 4));
    }

    public __exists(file) {
        return existsSync(`${this.config}/${file}.json`);
    }
}
