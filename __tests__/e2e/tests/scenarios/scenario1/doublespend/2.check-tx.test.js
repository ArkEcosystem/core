"use strict";

const testUtils = require("../../../../lib/utils/test-utils");
const utils = require("./utils");

describe("Check that only 1 transaction out of the 2 was accepted", () => {
    it("should have 1 transaction accepted", async () => {
        const response = await testUtils.GET("transactions");
        testUtils.expectSuccessful(response);

        // double spend - transfer
        const txTransfers = response.data.data.filter(
            transaction => transaction.recipient === utils.doubleTransferRecipient.address,
        );
        expect(txTransfers.length).toBe(1); // 1 transaction was sent to this address

        // double spend - transfer with 2nd signature
        const txTransfers2ndSig = response.data.data.filter(
            transaction => transaction.recipient === utils.doubleTransfer2ndsigRecipient.address,
        );
        expect(txTransfers2ndSig.length).toBe(1); // 1 transaction was sent to this address

        // double spend - vote
        const txVotes = response.data.data.filter(transaction => transaction.sender === utils.doubleVoteSender.address);
        expect(txVotes.length).toBe(1); // 1 transaction was sent from this address

        // double spend - delegate registration
        const txDelReg = response.data.data.filter(
            transaction => transaction.sender === utils.doubleDelRegSender.address,
        );
        expect(txDelReg.length).toBe(1); // 1 transaction was sent from this address

        // double spend - 2nd signature registration
        const tx2ndSigReg = response.data.data.filter(
            transaction => transaction.sender === utils.double2ndsigRegSender.address,
        );
        expect(tx2ndSigReg.length).toBe(1); // 1 transaction was sent from this address
    });
});
