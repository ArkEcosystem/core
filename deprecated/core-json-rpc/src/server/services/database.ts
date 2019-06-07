import Keyv from "keyv";

class Database {
    private database: Keyv;

    public init(options) {
        this.database = new Keyv(options);
    }

    public async get<T = any>(id: string): Promise<T> {
        return this.database.get(id);
    }

    public async set<T = any>(id: string, value: T): Promise<void> {
        await this.database.set(id, value);
    }
}

export const database = new Database();
