import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { AbstractCommand } from "../command";

export class RelayProcess extends AbstractCommand {
    public async start() {
        return this.buildApplication(app, {
            exclude: ["@arkecosystem/core-forger"],
            options: {
                "@arkecosystem/core-p2p": this.buildPeerOptions(this.options),
                "@arkecosystem/core-blockchain": {
                    networkStart: this.options.networkStart,
                },
            },
        });
    }

    public async stop() {
        pm2.stop("ark-core-relay");
    }

    public async restart() {
        pm2.reload("ark-core-relay");
    }

    public async monitor() {
        pm2.start({
            name: "ark-core-relay",
            script: "./dist/index.js",
            args: `relay:start --data ${this.options.data}
                               --config ${this.options.config}
                               --network ${this.options.network}`,
        });
    }
}
