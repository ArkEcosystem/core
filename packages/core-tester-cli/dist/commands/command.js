"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = __importStar(require("@oclif/command"));
const delay_1 = __importDefault(require("delay"));
const lodash_chunk_1 = __importDefault(require("lodash.chunk"));
const flags_1 = require("../flags");
const http_client_1 = require("../http-client");
const logger_1 = require("../logger");
const signer_1 = require("../signer");
class BaseCommand extends command_1.default {
    get network() {
        return this.constants.pubKeyHash;
    }
    async make(command) {
        const { args, flags } = this.parse(command);
        const host = flags.host.startsWith("http") ? flags.host : `http://${flags.host}`;
        this.api = new http_client_1.HttpClient(`${host}:${flags.portAPI}/api/`);
        await this.setupConfiguration();
        await this.setupConfigurationForCrypto();
        if (flags.passphrase) {
            const nonce = flags.nonce || (await this.getNonce(flags.passphrase));
            this.signer = new signer_1.Signer(this.network, nonce);
        }
        return { args, flags };
    }
    makeOffline(command) {
        const { args, flags } = this.parse(command);
        crypto_1.Managers.configManager.setFromPreset(flags.network);
        this.signer = new signer_1.Signer(crypto_1.Managers.configManager.all().network.pubKeyHash, flags.nonce);
        return { args, flags };
    }
    async sendTransaction(transactions) {
        if (!Array.isArray(transactions)) {
            transactions = [transactions];
        }
        for (const transaction of transactions) {
            let recipientId = transaction.recipientId;
            if (!recipientId) {
                recipientId = crypto_1.Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
            }
            logger_1.logger.info(`[T] ${transaction.id} (${recipientId} / ${this.fromSatoshi(transaction.amount)} / ${this.fromSatoshi(transaction.fee)})`);
        }
        return this.api.post("transactions", { transactions });
    }
    async knockTransaction(id) {
        try {
            const { data } = await this.api.get(`transactions/${id}`);
            logger_1.logger.info(`[T] ${id} (${data.blockId})`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(error.message);
            logger_1.logger.error(`[T] ${id} (not forged)`);
            return false;
        }
    }
    async knockBalance(address, expected) {
        const actual = await this.getWalletBalance(address);
        if (expected.isEqualTo(actual)) {
            logger_1.logger.info(`[W] ${address} (${this.fromSatoshi(actual)})`);
        }
        else {
            logger_1.logger.error(`[W] ${address} (${this.fromSatoshi(expected)} / ${this.fromSatoshi(actual)})`);
        }
    }
    async getWalletBalance(address) {
        try {
            const { data } = await this.api.get(`wallets/${address}`);
            return crypto_1.Utils.BigNumber.make(data.balance);
        }
        catch (error) {
            return crypto_1.Utils.BigNumber.ZERO;
        }
    }
    async broadcastTransactions(transactions) {
        for (const batch of lodash_chunk_1.default(transactions, 40)) {
            await this.sendTransaction(batch);
        }
        return this.awaitConfirmations(transactions);
    }
    async getTransaction(id) {
        try {
            const { data } = await this.api.get(`transactions/${id}`);
            return data;
        }
        catch (error) {
            logger_1.logger.error(error.message);
            return false;
        }
    }
    castFlags(values) {
        return Object.keys(BaseCommand.flagsConfig)
            .map((key) => {
            const value = values[key];
            if (value === undefined) {
                return undefined;
            }
            if (value === true) {
                return `--${key}`;
            }
            return `--${key}=${value}`;
        })
            .filter(value => value !== undefined);
    }
    toSatoshi(value) {
        return crypto_1.Utils.BigNumber.make(value)
            .times(1e8)
            .toFixed();
    }
    fromSatoshi(satoshi) {
        return crypto_1.Utils.formatSatoshi(satoshi);
    }
    async setupConfiguration() {
        try {
            const { data } = await this.api.get("node/configuration");
            this.constants = data.constants;
        }
        catch (error) {
            this.error(error.message);
        }
    }
    async setupConfigurationForCrypto() {
        try {
            const { data: dataCrypto } = await this.api.get("node/configuration/crypto");
            const { data: dataStatus } = await this.api.get("node/status");
            crypto_1.Managers.configManager.setConfig(dataCrypto);
            crypto_1.Managers.configManager.setHeight(dataStatus.now);
        }
        catch (error) {
            this.error(error.message);
        }
    }
    async awaitConfirmations(transactions) {
        if (process.env.NODE_ENV === "test") {
            return;
        }
        const waitPerBlock = this.constants.blocktime * Math.ceil(transactions.length / this.constants.block.maxTransactions);
        await delay_1.default(waitPerBlock * 1200);
    }
    async getNonce(passphrase) {
        const address = crypto_1.Identities.Address.fromPassphrase(passphrase);
        try {
            const { data } = await this.api.get(`wallets/${address}`);
            return data.nonce
                ? crypto_1.Utils.BigNumber.make(data.nonce)
                    .plus(1)
                    .toString()
                : "1";
        }
        catch (ex) {
            return "1";
        }
    }
}
exports.BaseCommand = BaseCommand;
BaseCommand.flagsConfig = {
    host: command_1.flags.string({
        description: "API host",
        default: "http://localhost",
    }),
    portAPI: command_1.flags.integer({
        description: "API port",
        default: 4003,
    }),
};
BaseCommand.flagsSend = {
    ...BaseCommand.flagsConfig,
    passphrase: command_1.flags.string({
        description: "passphrase of initial wallet",
        default: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
    }),
    secondPassphrase: command_1.flags.string({
        description: "second passphrase of initial wallet",
    }),
    nonce: command_1.flags.integer({
        description: "starting nonce",
    }),
    number: command_1.flags.integer({
        description: "number of wallets",
        default: 1,
    }),
    amount: flags_1.satoshiFlag({
        description: "initial wallet token amount",
        default: 2,
    }),
    transferFee: flags_1.satoshiFlag({
        description: "transfer fee",
        default: 0.1,
    }),
    skipProbing: command_1.flags.boolean({
        description: "skip transaction probing",
    }),
    waves: command_1.flags.integer({
        description: "number of waves to send",
        default: 1,
    }),
};
BaseCommand.flagsDebug = {
    network: command_1.flags.string({
        description: "network used for crypto",
        default: "testnet",
    }),
    log: command_1.flags.boolean({
        description: "log the data to the console",
    }),
    copy: command_1.flags.boolean({
        description: "copy the data to the clipboard",
    }),
};
//# sourceMappingURL=command.js.map