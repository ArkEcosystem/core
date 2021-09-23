"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@elastic/elasticsearch");
class Client {
    async setUp(options) {
        this.client = new elasticsearch_1.Client(options);
    }
    async bulk(body) {
        return this.client.bulk({ body });
    }
    async count(params) {
        return this.client.count(params);
    }
    async search(params) {
        return this.client.search(params);
    }
    async create(params) {
        return this.client.create(params);
    }
    async update(params) {
        return this.client.update(params);
    }
    async delete(params) {
        return this.client.delete(params);
    }
    async exists(params) {
        return this.client.exists(params);
    }
}
exports.client = new Client();
//# sourceMappingURL=client.js.map