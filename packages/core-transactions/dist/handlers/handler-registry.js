"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const errors_1 = require("../errors");
const delegate_registration_1 = require("./delegate-registration");
const delegate_resignation_1 = require("./delegate-resignation");
const htlc_claim_1 = require("./htlc-claim");
const htlc_lock_1 = require("./htlc-lock");
const htlc_refund_1 = require("./htlc-refund");
const ipfs_1 = require("./ipfs");
const multi_payment_1 = require("./multi-payment");
const multi_signature_1 = require("./multi-signature");
const second_signature_1 = require("./second-signature");
const transfer_1 = require("./transfer");
const vote_1 = require("./vote");
class TransactionHandlerRegistry {
    constructor() {
        this.registeredTransactionHandlers = new Map();
        this.knownWalletAttributes = new Map();
        this.registerTransactionHandler(transfer_1.TransferTransactionHandler);
        this.registerTransactionHandler(second_signature_1.SecondSignatureTransactionHandler);
        this.registerTransactionHandler(delegate_registration_1.DelegateRegistrationTransactionHandler);
        this.registerTransactionHandler(vote_1.VoteTransactionHandler);
        this.registerTransactionHandler(multi_signature_1.MultiSignatureTransactionHandler);
        this.registerTransactionHandler(ipfs_1.IpfsTransactionHandler);
        this.registerTransactionHandler(multi_payment_1.MultiPaymentTransactionHandler);
        this.registerTransactionHandler(delegate_resignation_1.DelegateResignationTransactionHandler);
        this.registerTransactionHandler(htlc_lock_1.HtlcLockTransactionHandler);
        this.registerTransactionHandler(htlc_claim_1.HtlcClaimTransactionHandler);
        this.registerTransactionHandler(htlc_refund_1.HtlcRefundTransactionHandler);
    }
    getAll() {
        return [...this.registeredTransactionHandlers.values()];
    }
    async get(type, typeGroup) {
        const internalType = crypto_1.Transactions.InternalTransactionType.from(type, typeGroup);
        if (this.registeredTransactionHandlers.has(internalType)) {
            const handler = this.registeredTransactionHandlers.get(internalType);
            if (!(await handler.isActivated())) {
                throw new errors_1.DeactivatedTransactionHandlerError(internalType);
            }
            return handler;
        }
        throw new errors_1.InvalidTransactionTypeError(internalType.toString());
    }
    async getActivatedTransactionHandlers() {
        const activatedTransactionHandlers = [];
        for (const handler of this.registeredTransactionHandlers.values()) {
            if (await handler.isActivated()) {
                activatedTransactionHandlers.push(handler);
            }
        }
        return activatedTransactionHandlers;
    }
    registerTransactionHandler(constructor) {
        const service = new constructor();
        const transactionConstructor = service.getConstructor();
        const { typeGroup, type } = transactionConstructor;
        for (const dependency of service.dependencies()) {
            this.registerTransactionHandler(dependency);
        }
        const internalType = crypto_1.Transactions.InternalTransactionType.from(type, typeGroup);
        if (this.registeredTransactionHandlers.has(internalType)) {
            return;
        }
        if (typeGroup !== crypto_1.Enums.TransactionTypeGroup.Core) {
            crypto_1.Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }
        const walletAttributes = service.walletAttributes();
        for (const attribute of walletAttributes) {
            assert_1.default(!this.knownWalletAttributes.has(attribute), `Wallet attribute is already known: ${attribute}`);
            this.knownWalletAttributes.set(attribute, true);
        }
        this.registeredTransactionHandlers.set(internalType, service);
    }
    deregisterTransactionHandler(constructor) {
        const service = new constructor();
        const transactionConstructor = service.getConstructor();
        const { typeGroup, type } = transactionConstructor;
        if (typeGroup === crypto_1.Enums.TransactionTypeGroup.Core || typeGroup === undefined) {
            throw new crypto_1.Errors.CoreTransactionTypeGroupImmutableError();
        }
        const internalType = crypto_1.Transactions.InternalTransactionType.from(type, typeGroup);
        if (!this.registeredTransactionHandlers.has(internalType)) {
            throw new errors_1.InvalidTransactionTypeError(internalType.toString());
        }
        const walletAttributes = service.walletAttributes();
        for (const attribute of walletAttributes) {
            this.knownWalletAttributes.delete(attribute);
        }
        crypto_1.Transactions.TransactionRegistry.deregisterTransactionType(transactionConstructor);
        this.registeredTransactionHandlers.delete(internalType);
    }
    isKnownWalletAttribute(attribute) {
        return this.knownWalletAttributes.has(attribute);
    }
}
exports.TransactionHandlerRegistry = TransactionHandlerRegistry;
exports.transactionHandlerRegistry = new TransactionHandlerRegistry();
//# sourceMappingURL=handler-registry.js.map