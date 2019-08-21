import { Support, Types } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { StateService } from "./service";
import { BlockStore } from "./stores/blocks";
import { StateStore } from "./stores/state";
import { TransactionStore } from "./stores/transactions";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(
            "state",
            new StateService({
                blocks: new BlockStore(1000),
                transactions: new TransactionStore(1000),
                storage: new StateStore(),
            }),
        );

        this.app.bind("state.options", this.opts);
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public defaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["state"];
    }
}
