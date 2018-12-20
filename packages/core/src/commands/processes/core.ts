import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { buildPeerOptions } from "../../utils";
import { AbstractCommand } from "../command";

export class CoreProcess extends AbstractCommand {
    public async start() {
        await app.setUp(this.options.parent._version, this.options, {
            options: {
                "@arkecosystem/core-p2p": buildPeerOptions(this.options),
                "@arkecosystem/core-blockchain": {
                    networkStart: this.options.networkStart,
                },
                "@arkecosystem/core-forger": {
                    bip38: this.options.forgerBip38 || process.env.ARK_FORGER_BIP38,
                    password: this.options.forgerBip39 || process.env.ARK_FORGER_BIP39,
                },
            },
            skipPlugins: this.options.skipPlugins,
            preset: this.options.preset,
        });

        return app;
    }

    public async stop() {
        pm2.stop("ark-core");
    }

    public async restart() {
        pm2.reload("ark-core");
    }

    public async monitor() {
        pm2.start({
            name: "ark-core",
            script: "./dist/index.js",
            args: `start --data ${this.options.data} --config ${this.options.config}`,
            env: {
                ARK_FORGER_BIP38: this.options.bip38,
                ARK_FORGER_PASSWORD: this.options.password,
            },
        });
    }
}
