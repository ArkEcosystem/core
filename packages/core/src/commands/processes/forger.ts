import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { AbstractCommand } from "../command";

export class ForgerProcess extends AbstractCommand {
    public async start() {
        await app.setUp(this.options.parent._version, this.options, {
            include: [
                "@arkecosystem/core-event-emitter",
                "@arkecosystem/core-config",
                "@arkecosystem/core-logger",
                "@arkecosystem/core-logger-winston",
                "@arkecosystem/core-forger",
            ],
            options: {
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
        pm2.stop("ark-core-forger");
    }

    public async restart() {
        pm2.reload("ark-core-forger");
    }

    public async monitor() {
        pm2.start({
            name: "ark-core-forger",
            script: "./dist/index.js",
            args: `forger --data ${this.options.data} --config ${this.options.config}`,
            env: {
                ARK_FORGER_BIP38: this.options.forgerBip38,
                ARK_FORGER_PASSWORD: this.options.forgerBip39,
            },
        });
    }
}
