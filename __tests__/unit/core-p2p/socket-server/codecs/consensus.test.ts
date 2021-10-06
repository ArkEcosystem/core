import { BuilderFactory } from "@arkecosystem/crypto/dist/transactions";
import { createBlockProposal } from "@packages/core-p2p/src/socket-server/codecs/consensus";
import { Identities, Transactions } from "@packages/crypto";
import clonedeep from "lodash.clonedeep";

import { createBlockProposalRequest, createBlockProposalResponse } from "../fixtures";

const recipientAddress = Identities.Address.fromPassphrase("recipient's secret");
const transaction = BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(recipientAddress)
    .sign("sender's secret")
    .build();
const transactionSerialized = Transactions.Serializer.serialize(transaction);

describe("Consensus Codec", () => {
    describe("createBlockProposalRequest ser/deser", () => {
        it("should give back the same data after ser and deser", () => {
            const result = createBlockProposal.request.deserialize(
                createBlockProposal.request.serialize(createBlockProposalRequest),
            );

            expect(result).toEqual(createBlockProposalRequest);
        });

        it("should decode max 500 transactions", () => {
            const dataWithTransactions = clonedeep(createBlockProposalRequest);
            dataWithTransactions.payload.transactions = Array(1000).fill(transactionSerialized);

            const result = createBlockProposal.request.deserialize(
                createBlockProposal.request.serialize(dataWithTransactions),
            );

            expect(result.payload.transactions.length).toEqual(500);
        });
    });

    describe("createBlockProposalResponse ser/deser", () => {
        it("should give back the same data after ser and deser", () => {
            const serDeser = createBlockProposal.response.deserialize(
                createBlockProposal.response.serialize(createBlockProposalResponse),
            );

            expect(serDeser).toEqual(createBlockProposalResponse);
        });
    });
});
