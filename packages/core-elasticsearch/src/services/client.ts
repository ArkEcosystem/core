import elasticsearch from "elasticsearch";

class Client {
    private client: elasticsearch.Client;

    /**
     * Create a new client instance.
     * @param {Object} options
     */
    public async setUp(options) {
        this.client = new elasticsearch.Client(options);
    }

    /**
     * Get the elasticsearch client.
     * @return {elasticsearch.Client}
     */
    public async getClient() {
        return this.client;
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} body
     * @return {Promise}
     */
    public async bulk(body) {
        return this.client.bulk({ body });
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} params
     * @return {Promise}
     */
    public async count(params) {
        return this.client.count(params);
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} params
     * @return {Promise}
     */
    public async search(params) {
        return this.client.search(params);
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} params
     * @return {Promise}
     */
    public async create(params) {
        return this.client.create(params);
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} params
     * @return {Promise}
     */
    public async update(params) {
        return this.client.update(params);
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} params
     * @return {Promise}
     */
    public async delete(params) {
        return this.client.delete(params);
    }

    /**
     * Perform an "UPDATE" operation.
     * @param  {Object} params
     * @return {Promise}
     */
    public async exists(params) {
        return this.client.exists(params);
    }
}

export const client = new Client();
