"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const joi_1 = __importDefault(require("@hapi/joi"));
const lodash_get_1 = __importDefault(require("lodash.get"));
const lodash_set_1 = __importDefault(require("lodash.set"));
const file_loader_1 = require("./file-loader");
class Config {
    async setUp(opts) {
        const network = this.configureNetwork(opts.network);
        this.config = await new file_loader_1.FileLoader().setUp(network);
        this.configureCrypto(network);
        return this;
    }
    all() {
        return this.config;
    }
    get(key, defaultValue) {
        return lodash_get_1.default(this.config, key, defaultValue);
    }
    set(key, value) {
        lodash_set_1.default(this.config, key, value);
    }
    getMilestone(height) {
        return crypto_1.Managers.configManager.getMilestone(height);
    }
    configureCrypto(value) {
        crypto_1.Managers.configManager.setConfig(value);
        this.config.network = crypto_1.Managers.configManager.get("network");
        this.config.exceptions = crypto_1.Managers.configManager.get("exceptions");
        this.config.milestones = crypto_1.Managers.configManager.get("milestones");
        this.config.genesisBlock = crypto_1.Managers.configManager.get("genesisBlock");
    }
    configureNetwork(network) {
        const config = crypto_1.Managers.NetworkManager.findByName(network);
        const { error } = joi_1.default.validate(config, joi_1.default.object({
            milestones: joi_1.default.array()
                .items(joi_1.default.object())
                .required(),
            exceptions: joi_1.default.object({
                blocks: joi_1.default.array().items(joi_1.default.string()),
                blocksTransactions: joi_1.default.object(),
                transactions: joi_1.default.array().items(joi_1.default.string()),
                outlookTable: joi_1.default.object(),
                transactionIdFixTable: joi_1.default.object(),
                wrongTransactionOrder: joi_1.default.object(),
                negativeBalances: joi_1.default.object(),
            }).default({
                exceptions: {},
            }),
            genesisBlock: joi_1.default.object().required(),
            network: joi_1.default.object({
                name: joi_1.default.string().required(),
                messagePrefix: joi_1.default.string().required(),
                bip32: joi_1.default.object({
                    public: joi_1.default.number()
                        .positive()
                        .required(),
                    private: joi_1.default.number()
                        .positive()
                        .required(),
                }),
                pubKeyHash: joi_1.default.number()
                    .min(0)
                    .required(),
                nethash: joi_1.default.string()
                    .hex()
                    .required(),
                slip44: joi_1.default.number().positive(),
                wif: joi_1.default.number()
                    .positive()
                    .required(),
                aip20: joi_1.default.number().required(),
                client: joi_1.default.object({
                    token: joi_1.default.string().required(),
                    symbol: joi_1.default.string().required(),
                    explorer: joi_1.default.string().required(),
                }),
            }).required(),
        }));
        if (error) {
            throw new Error(`An invalid network configuration was provided or is inaccessible due to it's security settings. ${error.message}.`);
        }
        process.env.CORE_NETWORK_NAME = config.network.name;
        return config;
    }
}
exports.Config = Config;
exports.configManager = new Config();
//# sourceMappingURL=index.js.map