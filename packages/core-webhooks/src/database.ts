import { ensureFileSync, existsSync } from "fs-extra";
import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import uuidv4 from "uuid/v4";

class Database {
    private database: lowdb.LowdbSync<any>;

    public make() {
        const adapterFile: string = `${process.env.CORE_PATH_CACHE}/webhooks.json`;

        if (!existsSync(adapterFile)) {
            ensureFileSync(adapterFile);
        }

        this.database = lowdb(new FileSync(adapterFile));
        this.database.defaults({ webhooks: [] }).write();
    }

    public paginate(params) {
        const rows = this.database
            .get("webhooks", [])
            .slice(params.offset, params.offset + params.limit)
            .value();

        return { rows, count: rows.length };
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
        data.id = uuidv4();

        this.database
            .get("webhooks")
            .push(data)
            .write();

        return this.findById(data.id);
    }

    public update(id, data) {
        return this.database
            .get("webhooks")
            .find({ id })
            .assign(data)
            .write();
    }

    public destroy(id) {
        try {
            return this.database
                .get("webhooks")
                .remove({ id })
                .write();
        } catch (error) {
            return false;
        }
    }
}

export const database = new Database();
