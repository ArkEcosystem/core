"use strict";

const axios = require("axios");
axios.defaults.adapter = require("axios/lib/adapters/http");

class Helpers {
    async GET(path, params = {}, nodeId = 0) {
        return this.request("GET", path, params, nodeId);
    }

    async POST(path, params = {}, nodeId = 0) {
        console.log(`POST request body:  ${JSON.stringify(params, null, 2)}`);
        return this.request("POST", path, params, nodeId);
    }

    async request(method, path, params = {}, nodeId = 0) {
        const url = `http://127.0.0.1:4900/node${nodeId}/api/v2/${path}`;
        const headers = {
            "API-Version": 2,
            "Content-Type": "application/json",
        };
        const request = axios[method.toLowerCase()];

        console.log(`[api] ${method} ${url}`);

        let response;
        try {
            response = ["GET", "DELETE"].includes(method) ?
                await request(url, {
                    params,
                    headers
                }) :
                await request(url, params, {
                    headers
                });
        } catch (e) {
            console.log("[api] request failed");
            if (method === "POST") {
                console.log(e);
            }
        }
        return response;
    }

    async getHeight() {
        // get height from the 3 first nodes and return the max
        let responses;
        try {
            responses = await Promise.all([
                this.GET("blocks?limit=1"),
                this.GET("blocks?limit=1", {}, 1),
                this.GET("blocks?limit=1", {}, 2),
            ]);
        } catch (e) {}

        return Math.max(...responses.map(res => (res ? res.data.data[0].height : 0)));
    }

    expectJson(response) {
        expect(response.data).toBeObject();
    }

    expectStatus(response, code) {
        expect(response.status).toBe(code);
    }

    expectResource(response) {
        expect(response.data.data).toBeObject();
    }

    expectCollection(response) {
        expect(Array.isArray(response.data.data)).toBe(true);
    }

    expectPaginator(response, firstPage = true) {
        expect(response.data.meta).toBeObject();
        expect(response.data.meta).toHaveProperty("count");
        expect(response.data.meta).toHaveProperty("pageCount");
        expect(response.data.meta).toHaveProperty("totalCount");
        expect(response.data.meta).toHaveProperty("next");
        expect(response.data.meta).toHaveProperty("previous");
        expect(response.data.meta).toHaveProperty("self");
        expect(response.data.meta).toHaveProperty("first");
        expect(response.data.meta).toHaveProperty("last");
    }

    expectSuccessful(response, statusCode = 200) {
        this.expectStatus(response, statusCode);
        this.expectJson(response);
    }

    expectError(response, statusCode = 404) {
        this.expectStatus(response, statusCode);
        this.expectJson(response);
        expect(response.data.statusCode).toBeNumber();
        expect(response.data.error).toBeString();
        expect(response.data.message).toBeString();
    }

    expectTransaction(transaction) {
        expect(transaction).toBeObject();
        expect(transaction).toHaveProperty("id");
        expect(transaction).toHaveProperty("blockId");
        expect(transaction).toHaveProperty("type");
        expect(transaction).toHaveProperty("amount");
        expect(transaction).toHaveProperty("fee");
        expect(transaction).toHaveProperty("sender");

        if ([1, 2].indexOf(transaction.type) === -1) {
            expect(transaction.recipient).toBeString();
        }

        expect(transaction.signature).toBeString();
        expect(transaction.confirmations).toBeNumber();
    }

    expectBlock(block) {
        expect(block).toBeObject();
        expect(block).toHaveProperty("id");
        expect(block).toHaveProperty("version");
        expect(block).toHaveProperty("height");
        expect(block).toHaveProperty("previous");
        expect(block).toHaveProperty("forged");
        expect(block.forged).toHaveProperty("reward");
        expect(block.forged).toHaveProperty("fee");
        expect(block).toHaveProperty("payload");
        expect(block.payload).toHaveProperty("length");
        expect(block.payload).toHaveProperty("hash");
        expect(block).toHaveProperty("generator");
        expect(block.generator).toHaveProperty("publicKey");
        expect(block).toHaveProperty("signature");
        expect(block).toHaveProperty("transactions");
    }

    expectDelegate(delegate, expected) {
        expect(delegate).toBeObject();
        expect(delegate.username).toBeString();
        expect(delegate.address).toBeString();
        expect(delegate.publicKey).toBeString();
        expect(delegate.votes).toBeNumber();
        expect(delegate.rank).toBeNumber();
        expect(delegate.blocks).toBeObject();
        expect(delegate.blocks.missed).toBeNumber();
        expect(delegate.blocks.produced).toBeNumber();
        expect(delegate.production).toBeObject();
        expect(delegate.production.approval).toBeString();
        expect(delegate.production.productivity).toBeString();

        Object.keys(expected || {}).forEach(attr => {
            expect(delegate[attr]).toBe(expected[attr]);
        });
    }

    expectWallet(wallet) {
        expect(wallet).toBeObject();
        expect(wallet).toHaveProperty("address");
        expect(wallet).toHaveProperty("publicKey");
        expect(wallet).toHaveProperty("balance");
        expect(wallet).toHaveProperty("isDelegate");
    }

    async createTransaction(options) {}
    /*async createTransaction (options) {
    client.setConfig(options.network)

    let transaction = transactionBuilder
      .transfer()
      .amount(options.amount)
      .recipientId(options.recipientId)
      .vendorField(options.vendorField)
      .sign(options.passphrase)
      .getStruct()

    await axios.post('http://127.0.0.1:4300/api/v2/transactions', {
      transactions: [transaction]
    })

    return transaction
  }*/
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers();
