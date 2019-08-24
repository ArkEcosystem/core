import { ensureFileSync, existsSync, removeSync } from "fs-extra";
import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import uuidv4 from "uuid/v4";
import { IWebhook } from "./interfaces";

class Database {
    private database: lowdb.LowdbSync<any>;

    public make(): void {
        const adapterFile = `${process.env.CORE_PATH_CACHE}/webhooks.json`;

        if (!existsSync(adapterFile)) {
            ensureFileSync(adapterFile);
        }

        this.database = lowdb(new FileSync(adapterFile));
        this.database.defaults({ webhooks: [] }).write();
    }

    public all(): IWebhook[] {
        return this.database.get("webhooks", []).value();
    }

    public hasById(id: string): boolean {
        return !!this.findById(id);
    }

    public findById(id: string): IWebhook {
        try {
            return this.database
                .get("webhooks")
                .find({ id })
                .value();
        } catch (error) {
            return undefined;
        }
    }

    public findByEvent(event: string): IWebhook[] {
        return this.database
            .get("webhooks")
            .filter({ event })
            .value();
    }

    public create(data: IWebhook): IWebhook {
        data.id = uuidv4();

        this.database
            .get("webhooks")
            .push(data)
            .write();

        return this.findById(data.id);
    }

    public update(id: string, data: IWebhook): IWebhook {
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

    public reset(): void {
        removeSync(`${process.env.CORE_PATH_CACHE}/webhooks.json`);

        this.make();
    }
}

export const database = new Database();
