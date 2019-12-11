"use strict";

const { Managers, Identities } = require("@arkecosystem/crypto");
const { generateMnemonic } = require("bip39");
const axios = require("axios");
axios.defaults.adapter = require("axios/lib/adapters/http");

class Helpers {
    async GET(path, params = {}, nodeId = 0) {
        return this.request("GET", path, params, nodeId);
    }

    async POST(path, params = {}, nodeId = 0) {
        console.log(`POST ${path} request body:  ${JSON.stringify(params, null, 2)}`);
        return this.request("POST", path, params, nodeId);
    }

    async request(method, path, params = {}, nodeId = 0) {
        const url = `http://127.0.0.1:4900/core${nodeId}/api/v2/${path}`;
        const headers = {
            "API-Version": 2,
            "Content-Type": "application/json",
        };
        const request = axios[method.toLowerCase()];

        let response;
        try {
            response = ["GET", "DELETE"].includes(method)
                ? await request(url, {
                      params,
                      headers,
                  })
                : await request(url, params, {
                      headers,
                  });
        } catch (e) {
            console.log("[api] request failed");
            if (method === "POST") {
                console.log(e);
            }
        }
        return response;
    }

    async getNodesHeight(nodeNumber = 3) {
        let responses;
        try {
            const getStatusPromises = [];
            for (const n of Array(nodeNumber).keys()) {
                getStatusPromises.push(this.GET("node/status", {}, n));
            }
            responses = await Promise.all(getStatusPromises);

            return responses.map(res => res.data.data.now);
        } catch (e) {};

        return [];
    }

    expectJson(response) {
        expect(response.data).toBeObject();
    }

    expectStatus(response, code) {
        expect(response.status).toBe(code);
    }

    expectSuccessful(response, statusCode = 200) {
        this.expectStatus(response, statusCode);
        this.expectJson(response);
    }

    generateWallets(walletsNames = []) {
        Managers.configManager.setFromPreset("testnet");
        const wallets = {};

        for (const walletName of walletsNames) {
            const passphrase = generateMnemonic();
            wallets[walletName] = {
                passphrase,
                address: Identities.Address.fromPassphrase(passphrase)
            }
        }

        return wallets;
    }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers();
