import { Client as ElasticSearch } from "elasticsearch";

class Client {
    private client: ElasticSearch;

    public async setUp(options: Record<string, any>) {
        this.client = new ElasticSearch(options);
    }

    public async bulk(body) {
        return this.client.bulk({ body });
    }

    public async count(params) {
        return this.client.count(params);
    }

    public async search(params) {
        return this.client.search(params);
    }

    public async create(params) {
        return this.client.create(params);
    }

    public async update(params) {
        return this.client.update(params);
    }

    public async delete(params) {
        return this.client.delete(params);
    }

    public async exists(params) {
        return this.client.exists(params);
    }
}

export const client = new Client();
