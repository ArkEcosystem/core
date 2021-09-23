"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const boom_1 = __importDefault(require("@hapi/boom"));
const bip39_1 = require("bip39");
const database_1 = require("../services/database");
const network_1 = require("../services/network");
const crypto_2 = require("../utils/crypto");
const transactions_1 = require("../utils/transactions");
exports.methods = [
    {
        name: "blocks.info",
        async method(params) {
            const response = await network_1.network.sendGET({ path: `blocks/${params.id}` });
            if (!response) {
                return boom_1.default.notFound(`Block ${params.id} could not be found.`);
            }
            return response.data;
        },
        schema: {
            type: "object",
            properties: {
                id: { blockId: {} },
            },
            required: ["id"],
        },
    },
    {
        name: "blocks.latest",
        async method() {
            const response = await network_1.network.sendGET({
                path: "blocks",
                query: { orderBy: "height:desc", limit: 1 },
            });
            return response ? response.data[0] : boom_1.default.notFound(`Latest block could not be found.`);
        },
    },
    {
        name: "blocks.transactions",
        async method(params) {
            const response = await network_1.network.sendGET({
                path: `blocks/${params.id}/transactions`,
                query: {
                    offset: params.offset,
                    orderBy: "timestamp:desc",
                },
            });
            if (!response) {
                return boom_1.default.notFound(`Block ${params.id} could not be found.`);
            }
            return {
                count: response.meta.totalCount,
                data: response.data,
            };
        },
        schema: {
            type: "object",
            properties: {
                id: { blockId: {} },
                offset: {
                    type: "number",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "transactions.broadcast",
        async method(params) {
            const transaction = await database_1.database.get(params.id);
            if (!transaction) {
                return boom_1.default.notFound(`Transaction ${params.id} could not be found.`);
            }
            const { data } = crypto_1.Transactions.TransactionFactory.fromData(transaction);
            if (!crypto_1.Transactions.Verifier.verifyHash(data)) {
                return boom_1.default.badData();
            }
            const broadcast = await network_1.network.sendPOST({
                path: "transactions",
                body: {
                    transactions: [transaction],
                },
            });
            if (Object.keys(broadcast.errors || {}).length > 0) {
                return boom_1.default.badData(broadcast.errors[transaction.id][0].message);
            }
            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                id: {
                    $ref: "transactionId",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "transactions.create",
        async method(params) {
            let transaction;
            try {
                transaction = await transactions_1.buildTransfer(params, "sign");
            }
            catch (error) {
                return boom_1.default.badData(error.message);
            }
            await database_1.database.set(transaction.id, transaction);
            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                amount: {
                    type: "number",
                },
                recipientId: {
                    type: "string",
                    $ref: "address",
                },
                passphrase: {
                    type: "string",
                },
                vendorField: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["amount", "recipientId", "passphrase"],
        },
    },
    {
        name: "transactions.transfer.create",
        async method(params) {
            let transaction;
            try {
                transaction = await transactions_1.buildTransfer(params, "sign");
            }
            catch (error) {
                return boom_1.default.badData(error.message);
            }
            await database_1.database.set(transaction.id, transaction);
            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                amount: {
                    type: "number",
                },
                recipientId: {
                    type: "string",
                    $ref: "address",
                },
                passphrase: {
                    type: "string",
                },
                vendorField: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["amount", "recipientId", "passphrase"],
        },
    },
    {
        name: "transactions.delegateRegistration.create",
        async method(params) {
            let transaction;
            try {
                transaction = await transactions_1.buildDelegateRegistration(params, "sign");
            }
            catch (error) {
                return boom_1.default.badData(error.message);
            }
            await database_1.database.set(transaction.id, transaction);
            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                username: {
                    type: "string",
                },
                passphrase: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["username", "passphrase"],
        },
    },
    {
        name: "transactions.vote.create",
        async method(params) {
            let transaction;
            try {
                transaction = await transactions_1.buildVote(params, "sign");
            }
            catch (error) {
                return boom_1.default.badData(error.message);
            }
            await database_1.database.set(transaction.id, transaction);
            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                },
                passphrase: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["publicKey", "passphrase"],
        },
    },
    {
        name: "transactions.unvote.create",
        async method(params) {
            let transaction;
            try {
                transaction = await transactions_1.buildUnvote(params, "sign");
            }
            catch (error) {
                return boom_1.default.badData(error.message);
            }
            await database_1.database.set(transaction.id, transaction);
            return transaction;
        },
        schema: {
            type: "object",
            properties: {
                publicKey: {
                    type: "string",
                },
                passphrase: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
            },
            required: ["publicKey", "passphrase"],
        },
    },
    {
        name: "transactions.info",
        async method(params) {
            const response = await network_1.network.sendGET({ path: `transactions/${params.id}` });
            if (!response) {
                return boom_1.default.notFound(`Transaction ${params.id} could not be found.`);
            }
            return response.data;
        },
        schema: {
            type: "object",
            properties: {
                id: {
                    $ref: "transactionId",
                },
            },
            required: ["id"],
        },
    },
    {
        name: "transactions.bip38.create",
        async method(params) {
            try {
                const wallet = await crypto_2.getBIP38Wallet(params.userId, params.bip38);
                if (!wallet) {
                    return boom_1.default.notFound(`User ${params.userId} could not be found.`);
                }
                let transaction;
                try {
                    transaction = await transactions_1.buildTransfer({ ...params, ...{ passphrase: wallet.wif } }, "signWithWif");
                }
                catch (error) {
                    return boom_1.default.badData();
                }
                await database_1.database.set(transaction.id, transaction);
                return transaction;
            }
            catch (error) {
                return boom_1.default.badImplementation(error.message);
            }
        },
        schema: {
            type: "object",
            properties: {
                amount: {
                    type: "number",
                },
                recipientId: {
                    type: "string",
                    $ref: "address",
                },
                vendorField: {
                    type: "string",
                },
                fee: {
                    type: "string",
                },
                bip38: {
                    type: "string",
                },
                userId: {
                    type: "string",
                    $ref: "hex",
                },
            },
            required: ["amount", "recipientId", "bip38", "userId"],
        },
    },
    {
        name: "wallets.create",
        async method(params) {
            const { publicKey } = crypto_1.Identities.Keys.fromPassphrase(params.passphrase);
            return {
                publicKey,
                address: crypto_1.Identities.Address.fromPublicKey(publicKey),
            };
        },
        schema: {
            type: "object",
            properties: {
                passphrase: {
                    type: "string",
                },
            },
            required: ["passphrase"],
        },
    },
    {
        name: "wallets.info",
        async method(params) {
            const response = await network_1.network.sendGET({ path: `wallets/${params.address}` });
            if (!response) {
                return boom_1.default.notFound(`Wallet ${params.address} could not be found.`);
            }
            return response.data;
        },
        schema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    $ref: "address",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "wallets.transactions",
        async method(params) {
            const response = await network_1.network.sendGET({
                path: `wallets/${params.address}/transactions`,
                query: {
                    offset: params.offset || 0,
                    orderBy: "timestamp:desc",
                },
            });
            if (!response || !response.data || !response.data.length) {
                return boom_1.default.notFound(`Wallet ${params.address} could not be found.`);
            }
            return {
                count: response.meta.totalCount,
                data: response.data,
            };
        },
        schema: {
            type: "object",
            properties: {
                address: {
                    type: "string",
                    $ref: "address",
                },
                offset: {
                    type: "integer",
                },
            },
            required: ["address"],
        },
    },
    {
        name: "wallets.bip38.create",
        async method(params) {
            try {
                const { keys, wif } = await crypto_2.getBIP38Wallet(params.userId, params.bip38);
                return {
                    publicKey: keys.publicKey,
                    address: crypto_1.Identities.Address.fromPublicKey(keys.publicKey),
                    wif,
                };
            }
            catch (error) {
                const { publicKey, privateKey } = crypto_1.Identities.Keys.fromPassphrase(bip39_1.generateMnemonic());
                const encryptedWIF = crypto_1.Crypto.bip38.encrypt(Buffer.from(privateKey, "hex"), true, params.bip38 + params.userId);
                await database_1.database.set(crypto_1.Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"), encryptedWIF);
                return {
                    publicKey,
                    address: crypto_1.Identities.Address.fromPublicKey(publicKey),
                    wif: crypto_2.decryptWIF(encryptedWIF, params.userId, params.bip38).wif,
                };
            }
        },
        schema: {
            type: "object",
            properties: {
                bip38: {
                    type: "string",
                },
                userId: {
                    type: "string",
                    $ref: "hex",
                },
            },
            required: ["bip38", "userId"],
        },
    },
    {
        name: "wallets.bip38.info",
        async method(params) {
            const encryptedWIF = await database_1.database.get(crypto_1.Crypto.HashAlgorithms.sha256(Buffer.from(params.userId)).toString("hex"));
            if (!encryptedWIF) {
                return boom_1.default.notFound(`User ${params.userId} could not be found.`);
            }
            const { keys, wif } = crypto_2.decryptWIF(encryptedWIF, params.userId, params.bip38);
            return {
                publicKey: keys.publicKey,
                address: crypto_1.Identities.Address.fromPublicKey(keys.publicKey),
                wif,
            };
        },
        schema: {
            type: "object",
            properties: {
                bip38: {
                    type: "string",
                },
                userId: {
                    type: "string",
                    $ref: "hex",
                },
            },
            required: ["bip38", "userId"],
        },
    },
];
//# sourceMappingURL=methods.js.map