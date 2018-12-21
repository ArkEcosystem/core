import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { AbstractCommand } from "../command";

export class CoreProcess extends AbstractCommand {
    public async start() {
        return this.buildApplication(app, {
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(this.options),
                "@arkecosystem/core-blockchain": {
                    networkStart: this.options.networkStart,
                },
                "@arkecosystem/core-forger": {
                    bip38: this.options.forgerBip38 || process.env.ARK_FORGER_BIP38,
                    password: this.options.forgerBip39 || process.env.ARK_FORGER_BIP39,
                },
            },
        });
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
            args: `start --data ${this.options.data}
                         --config ${this.options.config}
                         --network ${this.options.network}`,
            env: {
                ARK_FORGER_BIP38: this.options.bip38,
                ARK_FORGER_PASSWORD: this.options.password,
            },
        });
    }
}
