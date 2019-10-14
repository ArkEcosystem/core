import { Interfaces, Managers, Types } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";
import get from "lodash.get";
import set from "lodash.set";
import { FileLoader } from "./file-loader";

export class Config {
    private config: Record<string, any>;

    public async setUp(opts): Promise<Config> {
        const network: Interfaces.INetworkConfig = this.configureNetwork(opts.network);

        this.config = await new FileLoader().setUp(network);

        this.configureCrypto(network);

        return this;
    }

    public all(): any {
        return this.config;
    }

    public get<T = any>(key: string, defaultValue?: T): T {
        return get(this.config, key, defaultValue);
    }

    public set<T = any>(key: string, value: T): void {
        set(this.config, key, value);
    }

    public getMilestone(height: number): { [key: string]: any } {
        return Managers.configManager.getMilestone(height);
    }

    private configureCrypto(value: any): void {
        Managers.configManager.setConfig(value);

        this.config.network = Managers.configManager.get("network");
        this.config.exceptions = Managers.configManager.get("exceptions");
        this.config.milestones = Managers.configManager.get("milestones");
        this.config.genesisBlock = Managers.configManager.get("genesisBlock");
    }

    private configureNetwork(network: Types.NetworkName): Interfaces.INetworkConfig {
        const config: Interfaces.INetworkConfig = Managers.NetworkManager.findByName(network);

        const { error } = Joi.validate(
            config,
            Joi.object({
                milestones: Joi.array()
                    .items(Joi.object())
                    .required(),
                exceptions: Joi.object({
                    blocks: Joi.array().items(Joi.string()),
                    transactions: Joi.array().items(Joi.string()),
                    outlookTable: Joi.object(),
                    transactionIdFixTable: Joi.object(),
                    wrongTransactionOrder: Joi.object(),
                    negativeBalances: Joi.object(),
                }).default({
                    exceptions: {},
                }),
                genesisBlock: Joi.object().required(),
                network: Joi.object({
                    name: Joi.string().required(),
                    messagePrefix: Joi.string().required(),
                    bip32: Joi.object({
                        public: Joi.number()
                            .positive()
                            .required(),
                        private: Joi.number()
                            .positive()
                            .required(),
                    }),
                    pubKeyHash: Joi.number()
                        .min(0)
                        .required(),
                    nethash: Joi.string()
                        .hex()
                        .required(),
                    slip44: Joi.number().positive(),
                    wif: Joi.number()
                        .positive()
                        .required(),
                    aip20: Joi.number().required(),
                    client: Joi.object({
                        token: Joi.string().required(),
                        symbol: Joi.string().required(),
                        explorer: Joi.string().required(),
                    }),
                }).required(),
            }),
        );

        if (error) {
            throw new Error(
                `An invalid network configuration was provided or is inaccessible due to it's security settings. ${error.message}.`,
            );
        }

        process.env.CORE_NETWORK_NAME = config.network.name;

        return config;
    }
}

export const configManager = new Config();
