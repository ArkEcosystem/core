import { app } from "@arkecosystem/core-container";
import { ApiHelpers } from "@arkecosystem/core-test-utils/dist/helpers/api";
import { client, NetworkManager, transactionBuilder } from "@arkecosystem/crypto";
import axios from "axios";
import "jest-extended";

class Helpers {
    public async request(method, path, params = {}) {
        const url = `http://localhost:4003/api/${path}`;
        const headers = {
            "API-Version": 1,
            "Content-Type": "application/json",
        };

        const server = app.resolvePlugin("api");

        return ApiHelpers.request(server.http, method, url, headers, params);
    }

    public expectJson(response) {
        expect(response.data).toBeObject();
    }

    public expectStatus(response, code) {
        expect(response.status).toBe(code);
    }

    public assertVersion(response, version) {
        expect(response.headers).toBeObject();
        expect(response.headers).toHaveProperty("api-version", version);
    }

    public expectState(response, state) {
        expect(response.data).toHaveProperty("success", state);
    }

    public expectSuccessful(response) {
        this.expectStatus(response, 200);
        this.expectJson(response);
        this.expectState(response, true);
        this.assertVersion(response, 1);
    }

    public expectError(response) {
        this.expectStatus(response, 200);
        this.expectJson(response);
        this.expectState(response, false);
        this.assertVersion(response, 1);
    }

    public expectDelegate(delegate, expected: any = {}) {
        expect(delegate).toBeObject();
        expect(delegate.username).toBeString();
        expect(delegate.address).toBeString();
        expect(delegate.publicKey).toBeString();
        expect(delegate.vote).toBeString();
        expect(delegate.rate).toBeNumber();
        expect(delegate.missedblocks).toBeNumber();
        expect(delegate.producedblocks).toBeNumber();
        expect(delegate.approval).toBeNumber();
        expect(delegate.productivity).toBeNumber();

        Object.keys(expected || {}).forEach(attr => {
            expect(delegate[attr]).toBe(expected[attr]);
        });
    }

    public expectWallet(response) {
        expect(response).toHaveProperty("username");
        expect(response).toHaveProperty("address");
        expect(response).toHaveProperty("publicKey");
        expect(response).toHaveProperty("balance");
    }

    public async createTransaction() {
        client.setConfig(NetworkManager.findByName("testnet"));

        const transaction = transactionBuilder
            .transfer()
            .amount(1 * 1e8)
            .recipientId("AZFEPTWnn2Sn8wDZgCRF8ohwKkrmk2AZi1")
            .vendorField("test")
            .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
            .getStruct();

        await axios.post(
            "http://127.0.0.1:4003/api/v2/transactions",
            {
                transactions: [transaction],
            },
            {
                headers: { "Content-Type": "application/json" },
            },
        );

        return transaction;
    }
}

export const utils = new Helpers();
