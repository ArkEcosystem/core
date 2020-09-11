import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ensureFileSync, existsSync } from "fs-extra";
import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import { v4 as uuidv4 } from "uuid";

import { Webhook } from "./interfaces";

/**
 * @export
 * @class Database
 */
@Container.injectable()
export class Database {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Database
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {lowdb.LowdbSync<any>}
     * @memberof Database
     */
    private database: lowdb.LowdbSync<any>;

    /**
     * @memberof Database
     */
    public boot() {
        const adapterFile: string = this.app.cachePath("webhooks.json");

        if (!existsSync(adapterFile)) {
            ensureFileSync(adapterFile);
        }

        this.database = lowdb(new FileSync(adapterFile));
        this.database.defaults({ webhooks: [] }).write();
    }

    /**
     * @returns {Webhook[]}
     * @memberof Database
     */
    public all(): Webhook[] {
        // @ts-ignore
        return this.database.get("webhooks", []).value();
    }

    /**
     * @param {string} id
     * @returns {boolean}
     * @memberof Database
     */
    public hasById(id: string): boolean {
        return !!this.findById(id);
    }

    /**
     * @param {string} id
     * @returns {(Webhook | undefined)}
     * @memberof Database
     */
    public findById(id: string): Webhook | undefined {
        // @ts-ignore
        return this.database.get("webhooks").find({ id }).value();
    }

    /**
     * @param {string} event
     * @returns {Webhook[]}
     * @memberof Database
     */
    public findByEvent(event: string): Webhook[] {
        // @ts-ignore
        return this.database.get("webhooks").filter({ event }).value();
    }

    /**
     * @param {Webhook} data
     * @returns {(Webhook | undefined)}
     * @memberof Database
     */
    public create(data: Webhook): Webhook | undefined {
        data.id = uuidv4();

        // @ts-ignore
        this.database.get("webhooks").push(data).write();

        return this.findById(data.id);
    }

    /**
     * @param {string} id
     * @param {Webhook} data
     * @returns {Webhook}
     * @memberof Database
     */
    public update(id: string, data: Webhook): Webhook {
        // @ts-ignore
        return this.database.get("webhooks").find({ id }).assign(data).write();
    }

    /**
     * @param {string} id
     * @memberof Database
     */
    public destroy(id: string): void {
        // @ts-ignore
        this.database.get("webhooks").remove({ id }).write();
    }
}
