import { ensureFileSync, existsSync } from "fs-extra";
import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import uuidv4 from "uuid/v4";

class Database {
    private readonly adapterFile: string = `${process.env.CORE_PATH_CACHE}/webhooks.json`;
    private readonly database: FileSync = lowdb(new FileSync(this.adapterFile));

    public constructor() {
        if (!existsSync(this.adapterFile)) {
            ensureFileSync(this.adapterFile);

            this.database.defaults({ webhooks: [] }).write();
        }
    }

    public paginate(params) {
        return this.database.get("webhooks").slice(params.offset, params.offset + params.limit);
    }

    public findById(id) {
        return this.database
            .get("webhooks")
            .find({ id })
            .value();
    }

    public findByEvent(event) {
        return this.database
            .get("webhooks")
            .find({ event })
            .value();
    }

    public create(data) {
        return this.database
            .get(`webhooks.${uuidv4()}`)
            .push(data)
            .write();
    }

    public update(id, data) {
        return this.database.set(`webhooks.${id}`, data).write();
    }

    public destroy(id) {
        return this.database
            .get("webhooks")
            .find({ id })
            .remove()
            .write();
    }
}

export const database = new Database();
