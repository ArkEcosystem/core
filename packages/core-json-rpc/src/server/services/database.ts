import Keyv from "keyv";

class Database {
    public database: Keyv;

    public init(options) {
        this.database = new Keyv(options);
    }

    public async get(id) {
        return this.database.get(id);
    }

    public async set(id, value) {
        return this.database.set(id, value);
    }

    public async delete(id) {
        return this.database.delete(id);
    }

    public async clear() {
        return this.database.clear();
    }
}

export const database = new Database();
