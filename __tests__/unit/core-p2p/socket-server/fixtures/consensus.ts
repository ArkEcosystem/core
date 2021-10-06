import { BuilderFactory } from "@arkecosystem/crypto/dist/transactions";
import { Contracts, Utils } from "@packages/core-kernel";
import { Identities, Transactions } from "@packages/crypto";

const recipientAddress = Identities.Address.fromPassphrase("recipient's secret");
const transaction = BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(recipientAddress)
    .sign("sender's secret")
    .build();
const transactionSerialized = Transactions.Serializer.serialize(transaction);

export const createBlockProposalRequest: Contracts.P2P.CreateBlockProposalRequest = {
    blockHash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
    height: 1,
    generatorPublicKey: "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
    signature:
        "3045022100ec71805b816b2c09ae7689bef633d3a59a24a3a7516e55255abba9ad69ba15650220583550dd2bb2d76ed2519c8395a41c2e0fbbb287ff02d73452365b41e19889af",
    timestamp: 1,
    payload: {
        version: 1,
        generatorPublicKey: "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
        timestamp: 1,
        previousBlock: "7478738808284595152",
        height: 1,
        numberOfTransactions: 1,
        totalAmount: Utils.BigNumber.ZERO,
        totalFee: Utils.BigNumber.ZERO,
        reward: Utils.BigNumber.ZERO,
        payloadLength: 100,
        payloadHash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
        transactions: [transactionSerialized],
        signatures: [
            "3045022100ec71805b816b2c09ae7689bef633d3a59a24a3a7516e55255abba9ad69ba15650220583550dd2bb2d76ed2519c8395a41c2e0fbbb287ff02d73452365b41e19889af",
        ],
    },
    headers: { version: "3.0.0-next.18" },
};

export const createBlockProposalResponse: Contracts.P2P.CreateBlockProposalResponse = {
    status: true,
};
