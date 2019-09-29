import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ensureFileSync, existsSync } from "fs-extra";
import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import uuidv4 from "uuid/v4";

import { Webhook } from "./interfaces";

// todo: review the implementation and check for issues with mutability
@Container.injectable()
export class Database {
    @Container.inject(Container.Identifiers.Application)
    private readonly app: Contracts.Kernel.Application;

    private database: lowdb.LowdbSync<any>;

    public init() {
        const adapterFile = this.app.cachePath("webhooks.json");

        if (!existsSync(adapterFile)) {
            ensureFileSync(adapterFile);
        }

        this.database = lowdb(new FileSync(adapterFile));
        this.database.defaults({ webhooks: [] }).write();
    }

    public all(): Webhook[] {
        return this.database.get("webhooks", []).value();
    }

    public hasById(id: string): boolean {
        return !!this.findById(id);
    }

    public findById(id: string): Webhook {
        try {
            return this.database
                .get("webhooks")
                .find({ id })
                .value();
        } catch (error) {
            return undefined;
        }
    }

    public findByEvent(event: string): Webhook[] {
        return this.database
            .get("webhooks")
            .filter({ event })
            .value();
    }

    public create(data: Webhook): Webhook {
        data.id = uuidv4();

        this.database
            .get("webhooks")
            .push(data)
            .write();

        return this.findById(data.id);
    }

    public update(id: string, data: Webhook): Webhook {
        return this.database
            .get("webhooks")
            .find({ id })
            .assign(data)
            .write();
    }

    public destroy(id: string): void {
        this.database
            .get("webhooks")
            .remove({ id })
            .write();
    }
}
