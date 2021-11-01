import { postTransactions } from "@arkecosystem/core-p2p/src/socket-server/codecs/transactions";

describe("Transactions codec tests", () => {
    describe("postTransactions ser/deser", () => {
        it("should give back the same data after ser and deser", () => {
            const transactions = [
                Buffer.from("randomdata1"),
                Buffer.from("someotherdata2"),
                Buffer.from("andalastone3"),
            ]; // just mock transactions with some Buffers
            const data = { transactions, headers: { version: "3.0.0-next.18" } };
            const serDeser = postTransactions.request.deserialize(postTransactions.request.serialize(data));

            expect(serDeser).toEqual(data);
        })
    })
})