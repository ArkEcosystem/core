import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
import { Blocks, Crypto, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import envPaths from "env-paths";
import { ensureDirSync, existsSync, readJSONSync, writeFileSync, writeJSONSync } from "fs-extra";
import Joi from "joi";
import { join, resolve } from "path";
import prompts from "prompts";

interface Wallet {
    address: string;
    passphrase: string;
    keys: Interfaces.IKeyPair;
    username: string | undefined;
}

interface Flag {
    name: string;
    description: string;
    schema: Joi.Schema;
    promptType?: string;
    default?: any;
}

interface DynamicFees {
    enabled?: boolean;
    minFeePool?: number;
    minFeeBroadcast?: number;
    addonBytes: {
        transfer?: number;
        secondSignature?: number;
        delegateRegistration?: number;
        vote?: number;
        multiSignature?: number;
        ipfs?: number;
        multiPayment?: number;
        delegateResignation?: number;
        htlcLock?: number;
        htlcClaim?: number;
        htlcRefund?: number;
    };
}

interface Options {
    network: string;
    premine: string;
    delegates: number;
    blocktime: number;
    maxTxPerBlock: number;
    maxBlockPayload: number;
    rewardHeight: number;
    rewardAmount: string | number;
    pubKeyHash: number;
    wif: number;
    token: string;
    symbol: string;
    explorer: string;
    distribute: boolean;
    epoch: Date;
    htlcEnabled?: boolean;
    vendorFieldLength: number;

    // Static Fee
    feeStaticTransfer: number;
    feeStaticSecondSignature: number;
    feeStaticDelegateRegistration: number;
    feeStaticVote: number;
    feeStaticMultiSignature: number;
    feeStaticIpfs: number;
    feeStaticMultiPayment: number;
    feeStaticDelegateResignation: number;
    feeStaticHtlcLock: number;
    feeStaticHtlcClaim: number;
    feeStaticHtlcRefund: number;

    // Dynamic Fee
    feeDynamicEnabled?: boolean;
    feeDynamicMinFeePool?: number;
    feeDynamicMinFeeBroadcast?: number;
    feeDynamicBytesTransfer?: number;
    feeDynamicBytesSecondSignature?: number;
    feeDynamicBytesDelegateRegistration?: number;
    feeDynamicBytesVote?: number;
    feeDynamicBytesMultiSignature?: number;
    feeDynamicBytesIpfs?: number;
    feeDynamicBytesMultiPayment?: number;
    feeDynamicBytesDelegateResignation?: number;
    feeDynamicBytesHtlcLock?: number;
    feeDynamicBytesHtlcClaim?: number;
    feeDynamicBytesHtlcRefund?: number;

    // Env
    coreDBHost: string;
    coreDBPort: number;
    coreDBUsername?: string;
    coreDBPassword?: string;
    coreDBDatabase?: string;

    coreP2PPort: number;
    coreAPIPort: number;
    coreWebhooksPort: number;
    coreMonitorPort: number;

    // Peers
    peers: string;

    // General
    configPath?: string;
    overwriteConfig: boolean;
    force: boolean;
}

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    @Container.inject(Container.Identifiers.Logger)
    private readonly logger!: Services.Logger;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "network:generate";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Generates a new network configuration.";

    /**
     * Indicates whether the command requires a network to be present.
     *
     * @type {boolean}
     * @memberof Command
     */
    public requiresNetwork: boolean = false;

    /*eslint-disable */
    private flagSettings: Flag[] = [
        { name: "network", description: "The name of the network.", schema: Joi.string(), promptType: "text" },
        {
            name: "premine",
            description: "The number of pre-mined tokens.",
            schema: Joi.alternatives().try(Joi.string(), Joi.number()),
            promptType: "text",
            default: "12500000000000000",
        },
        {
            name: "delegates",
            description: "The number of delegates to generate.",
            schema: Joi.number(),
            promptType: "number",
            default: 51,
        },
        {
            name: "blocktime",
            description: "The network blocktime.",
            schema: Joi.number(),
            promptType: "number",
            default: 8,
        },
        {
            name: "maxTxPerBlock",
            description: "The maximum number of transactions per block.",
            schema: Joi.number(),
            promptType: "number",
            default: 150,
        },
        {
            name: "maxBlockPayload",
            description: "The maximum payload length by block.",
            schema: Joi.number(),
            promptType: "number",
            default: 2097152,
        },
        {
            name: "rewardHeight",
            description: "The height at which delegate block reward starts.",
            schema: Joi.number(),
            promptType: "number",
            default: 75600,
        },
        {
            name: "rewardAmount",
            description: "The number of the block reward per forged block.",
            schema: Joi.alternatives().try(Joi.string(), Joi.number()),
            promptType: "number",
            default: "200000000",
        },
        {
            name: "pubKeyHash",
            description: "The public key hash.",
            schema: Joi.number(),
            promptType: "number",
            default: 30,
        },
        {
            name: "wif",
            description: "The WIF (Wallet Import Format) that should be used.",
            schema: Joi.number(),
            promptType: "number",
        },
        {
            name: "token",
            description: "The name that is attributed to the token on the network.",
            schema: Joi.string(),
            promptType: "text",
        },
        {
            name: "symbol",
            description: "The character that is attributed to the token on the network.",
            schema: Joi.string(),
            promptType: "text",
        },
        {
            name: "explorer",
            description: "The URL that hosts the network explorer.",
            schema: Joi.string(),
            promptType: "text",
        },
        {
            name: "distribute",
            description: "Distribute the premine evenly between all delegates?",
            schema: Joi.bool(),
            promptType: "confirm",
            default: false,
        },

        {
            name: "epoch",
            description: "Start time of the network.",
            schema: Joi.date(),
            default: new Date(Date.now()).toISOString().slice(0, 11) + "00:00:00.000Z",
        },
        { name: "htlcEnabled", description: "Enable HTLC transactions.", schema: Joi.boolean() },
        {
            name: "vendorFieldLength",
            description: "The maximum length of transaction's vendor field",
            schema: Joi.number().min(0).max(255),
            default: 255,
        },

        // Static fee
        {
            name: "feeStaticTransfer",
            description: "Fee for transfer transactions.",
            schema: Joi.number(),
            default: 10000000,
        },
        {
            name: "feeStaticSecondSignature",
            description: "Fee for second signature transactions.",
            schema: Joi.number(),
            default: 500000000,
        },
        {
            name: "feeStaticDelegateRegistration",
            description: "Fee for delegate registration transactions.",
            schema: Joi.number(),
            default: 2500000000,
        },
        { name: "feeStaticVote", description: "Fee for vote transactions.", schema: Joi.number(), default: 100000000 },
        {
            name: "feeStaticMultiSignature",
            description: "Fee for multi signature transactions.",
            schema: Joi.number(),
            default: 500000000,
        },
        { name: "feeStaticIpfs", description: "Fee for ipfs transactions.", schema: Joi.number(), default: 500000000 },
        {
            name: "feeStaticMultiPayment",
            description: "Fee for multi payment transactions.",
            schema: Joi.number(),
            default: 10000000,
        },
        {
            name: "feeStaticDelegateResignation",
            description: "Fee for delegate resignation transactions.",
            schema: Joi.number(),
            default: 2500000000,
        },
        {
            name: "feeStaticHtlcLock",
            description: "Fee for HTLC lock transactions.",
            schema: Joi.number(),
            default: 10000000,
        },
        {
            name: "feeStaticHtlcClaim",
            description: "Fee for HTLC claim transactions.",
            schema: Joi.number(),
            default: 0,
        },
        {
            name: "feeStaticHtlcRefund",
            description: "Fee for HTLC refund transactions.",
            schema: Joi.number(),
            default: 0,
        },

        // Dynamic fee
        { name: "feeDynamicEnabled", description: "Dynamic fee enabled", schema: Joi.boolean() },
        { name: "feeDynamicMinFeePool", description: "Minimum dynamic fee to enter the pool.", schema: Joi.number() },
        { name: "feeDynamicMinFeeBroadcast", description: "Minimum dynamic fee to broadcast.", schema: Joi.number() },
        {
            name: "feeDynamicBytesTransfer",
            description: "Dynamic fee for transfer transactions.",
            schema: Joi.number(),
        },
        {
            name: "feeDynamicBytesSecondSignature",
            description: "Dynamic fee for second signature transactions.",
            schema: Joi.number(),
        },
        {
            name: "feeDynamicBytesDelegateRegistration",
            description: "Dynamic fee for delegate registration transactions.",
            schema: Joi.number(),
        },
        { name: "feeDynamicBytesVote", description: "Dynamic fee for vote transactions.", schema: Joi.number() },
        {
            name: "feeDynamicBytesMultiSignature",
            description: "Dynamic fee for multi signature transactions.",
            schema: Joi.number(),
        },
        { name: "feeDynamicBytesIpfs", description: "Dynamic fee for IPFS transactions.", schema: Joi.number() },
        {
            name: "feeDynamicBytesMultiPayment",
            description: "Dynamic fee for multi payment transactions.",
            schema: Joi.number(),
        },
        {
            name: "feeDynamicBytesDelegateResignation",
            description: "Dynamic fee for delegate registration transactions.",
            schema: Joi.number(),
        },
        {
            name: "feeDynamicBytesHtlcLock",
            description: "Dynamic fee for HTLC lock transactions.",
            schema: Joi.number(),
        },
        {
            name: "feeDynamicBytesHtlcClaim",
            description: "Dynamic fee for HTLC claim transactions.",
            schema: Joi.number(),
        },
        {
            name: "feeDynamicBytesHtlcRefund",
            description: "Dynamic fee for HTLC refund transactions.",
            schema: Joi.number(),
        },

        // Env
        { name: "coreDBHost", description: "Core database host.", schema: Joi.string(), default: "localhost" },
        { name: "coreDBPort", description: "Core database port.", schema: Joi.number(), default: 5432 },
        { name: "coreDBUsername", description: "Core database username.", schema: Joi.string() },
        { name: "coreDBPassword", description: "Core database password.", schema: Joi.string() },
        { name: "coreDBDatabase", description: "Core database database.", schema: Joi.string() },

        { name: "coreP2PPort", description: "Core P2P port.", schema: Joi.number(), default: 4000 },
        { name: "coreAPIPort", description: "Core API port.", schema: Joi.number(), default: 4003 },
        { name: "coreWebhooksPort", description: "Core Webhooks port.", schema: Joi.number(), default: 4004 },
        { name: "coreMonitorPort", description: "Core Webhooks port.", schema: Joi.number(), default: 4005 },

        // Peers
        {
            name: "peers",
            description: "Peers IP addresses (and ports), separated with comma.",
            schema: Joi.string().allow(""),
            default: "127.0.0.1",
        },

        // General
        { name: "configPath", description: "Configuration path.", schema: Joi.string() },
        {
            name: "overwriteConfig",
            description: "Overwrite existing configuration.",
            schema: Joi.boolean(),
            default: false,
        },
        { name: "force", description: "Skip prompts and use given flags.", schema: Joi.boolean(), default: false },
    ];
    /*eslint-enable */

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        for (const flag of this.flagSettings) {
            const flagSchema: Joi.Schema = flag.schema;

            if (flag.default !== undefined) {
                flagSchema.default(flag.default);

                flag.description += ` (${flag.default.toString()})`;
            }

            this.definition.setFlag(flag.name, flag.description, flag.schema);
        }
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const flags: Contracts.AnyObject = this.getFlags();

        const allFlagsSet = !this.flagSettings
            .filter((flag) => flag.promptType)
            .find((flag) => flags[flag.name] === undefined);

        const defaults = this.flagSettings.reduce<any>((acc: any, flag: Flag) => {
            acc[flag.name] = flag.default;

            return acc;
        }, {});

        let options = {
            ...defaults,
            ...flags,
        };

        if (flags.force || allFlagsSet) {
            return this.generateNetwork(options as Options);
        }

        const response = await prompts(
            this.flagSettings
                .filter((flag) => flag.promptType) // Show prompt only for flags with defined promptType
                .map(
                    (flag) =>
                        ({
                            type: flag.promptType,
                            name: flag.name,
                            message: flag.description,
                            initial: flags[flag.name] ? `${flags[flag.name]}` : flag.default || "undefined",
                        } as prompts.PromptObject<string>),
                )
                .concat({
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                } as prompts.PromptObject<string>),
        );

        options = {
            ...defaults,
            ...flags,
            ...response,
        };

        if (!response.confirm) {
            throw new Error("You'll need to confirm the input to continue.");
        }

        for (const flag of this.flagSettings.filter((flag) => flag.promptType)) {
            if (flag.promptType === "text" && options[flag.name] !== "undefined") {
                continue;
            }

            if (flag.promptType === "number" && !Number.isNaN(options[flag.name])) {
                continue;
            }

            if (["confirm", "date"].includes(flag.promptType!)) {
                continue;
            }

            throw new Error(`Flag ${flag.name} is required.`);
        }

        await this.generateNetwork(options);
    }

    private async generateNetwork(flags: Options): Promise<void> {
        const paths = envPaths(flags.token, { suffix: "core" });
        const configPath = flags.configPath ? flags.configPath : paths.config;

        const coreConfigDest = join(configPath, flags.network);
        const cryptoConfigDest = join(coreConfigDest, "crypto");

        const delegates: any[] = this.generateCoreDelegates(flags.delegates, flags.pubKeyHash);

        const genesisWallet = this.createWallet(flags.pubKeyHash);

        await this.components.taskList([
            {
                title: `Prepare directories.`,
                task: async () => {
                    if (!flags.overwriteConfig) {
                        if (existsSync(coreConfigDest)) {
                            throw new Error(`${coreConfigDest} already exists.`);
                        }

                        if (existsSync(cryptoConfigDest)) {
                            throw new Error(`${cryptoConfigDest} already exists.`);
                        }
                    }

                    ensureDirSync(coreConfigDest);
                    ensureDirSync(cryptoConfigDest);
                },
            },
            {
                title: "Persist genesis wallet to genesis-wallet.json in core config path.",
                task: async () => {
                    writeJSONSync(resolve(coreConfigDest, "genesis-wallet.json"), genesisWallet, { spaces: 4 });
                },
            },
            {
                title: "Generate crypto network configuration.",
                task: async () => {
                    const genesisBlock = this.generateCryptoGenesisBlock(genesisWallet, delegates, flags);

                    writeJSONSync(
                        resolve(cryptoConfigDest, "network.json"),
                        this.generateCryptoNetwork(genesisBlock.payloadHash, flags),
                        { spaces: 4 },
                    );

                    writeJSONSync(resolve(cryptoConfigDest, "milestones.json"), this.generateCryptoMilestones(flags), {
                        spaces: 4,
                    });

                    writeJSONSync(resolve(cryptoConfigDest, "genesisBlock.json"), genesisBlock, { spaces: 4 });

                    writeJSONSync(resolve(cryptoConfigDest, "exceptions.json"), {});

                    writeFileSync(
                        resolve(cryptoConfigDest, "index.ts"),
                        [
                            'import exceptions from "./exceptions.json";',
                            'import genesisBlock from "./genesisBlock.json";',
                            'import milestones from "./milestones.json";',
                            'import network from "./network.json";',
                            "",
                            `export const ${flags.network} = { exceptions, genesisBlock, milestones, network };`,
                            "",
                        ].join("\n"),
                    );
                },
            },
            {
                title: "Generate Core network configuration.",
                task: async () => {
                    writeJSONSync(resolve(coreConfigDest, "peers.json"), this.generatePeers(flags), { spaces: 4 });

                    writeJSONSync(
                        resolve(coreConfigDest, "delegates.json"),
                        { secrets: delegates.map((d) => d.passphrase) },
                        { spaces: 4 },
                    );

                    writeFileSync(resolve(coreConfigDest, ".env"), this.generateEnvironmentVariables(flags));

                    writeJSONSync(resolve(coreConfigDest, "app.json"), this.generateApp(flags), { spaces: 4 });
                },
            },
        ]);

        this.logger.info(`Configuration generated on location: ${coreConfigDest}`);
    }

    private generateCryptoNetwork(nethash: string, options: Options) {
        return {
            name: options.network,
            messagePrefix: `${options.network} message:\n`,
            bip32: {
                public: 70617039,
                private: 70615956,
            },
            pubKeyHash: options.pubKeyHash,
            nethash,
            wif: options.wif,
            slip44: 1,
            aip20: 0,
            client: {
                token: options.token,
                symbol: options.symbol,
                explorer: options.explorer,
            },
        };
    }

    private generateCryptoMilestones(options: Options) {
        const epoch = new Date(options.epoch);

        return [
            {
                height: 1,
                reward: "0",
                activeDelegates: options.delegates,
                blocktime: options.blocktime,
                block: {
                    version: 0,
                    idFullSha256: true,
                    maxTransactions: options.maxTxPerBlock,
                    maxPayload: options.maxBlockPayload,
                },
                epoch: epoch.toISOString(),
                fees: {
                    staticFees: {
                        transfer: options.feeStaticTransfer,
                        secondSignature: options.feeStaticSecondSignature,
                        delegateRegistration: options.feeStaticDelegateRegistration,
                        vote: options.feeStaticVote,
                        multiSignature: options.feeStaticMultiSignature,
                        ipfs: options.feeStaticIpfs,
                        multiPayment: options.feeStaticMultiPayment,
                        delegateResignation: options.feeStaticDelegateResignation,
                        htlcLock: options.feeStaticHtlcLock,
                        htlcClaim: options.feeStaticHtlcClaim,
                        htlcRefund: options.feeStaticHtlcRefund,
                    },
                },
                vendorFieldLength: options.vendorFieldLength,
                multiPaymentLimit: 256,
                htlcEnabled: options.htlcEnabled,
                aip11: true,
            },
            {
                height: options.rewardHeight,
                reward: options.rewardAmount,
            },
        ];
    }

    private generateCryptoGenesisBlock(genesisWallet, delegates, options: Options) {
        // we need to set aip11 and network.pubKeyHash for tx builder to build v2 txs without issue
        Managers.configManager.getMilestone().aip11 = true;
        Managers.configManager.set("network.pubKeyHash", options.pubKeyHash);
        Managers.configManager.getMilestone().block = { idFullSha256: true }; // so that generated block has full sha256 id

        const premineWallet: Wallet = this.createWallet(options.pubKeyHash);

        let transactions = [];

        if (options.distribute) {
            transactions = transactions.concat(
                ...this.createTransferTransactions(premineWallet, delegates, options.premine, options.pubKeyHash),
            );
        } else {
            transactions = transactions.concat(
                this.createTransferTransaction(premineWallet, genesisWallet, options.premine, options.pubKeyHash),
            );
        }

        transactions = transactions.concat(
            ...this.buildDelegateTransactions(delegates, options.pubKeyHash),
            ...this.buildVoteTransactions(delegates, options.pubKeyHash),
        );

        return this.createGenesisBlock(premineWallet.keys, transactions, 0);
    }

    private generateEnvironmentVariables(options: Options): string {
        let result = "";

        result += "CORE_LOG_LEVEL=info\n";
        result += "CORE_LOG_LEVEL_FILE=info\n\n";

        result += `CORE_DB_HOST=${options.coreDBHost}\n`;
        result += `CORE_DB_PORT=${options.coreDBPort}\n`;
        result += options.coreDBUsername ? `CORE_DB_USERNAME=${options.coreDBUsername}\n` : "";
        result += options.coreDBPassword ? `CORE_DB_PASSWORD=${options.coreDBPassword}\n` : "";
        result += options.coreDBDatabase ? `CORE_DB_DATABASE=${options.coreDBDatabase}\n\n` : "\n";

        result += "CORE_P2P_HOST=0.0.0.0\n";
        result += `CORE_P2P_PORT=${options.coreP2PPort}\n\n`;

        result += "CORE_API_HOST=0.0.0.0\n";
        result += `CORE_API_PORT=${options.coreAPIPort}\n\n`;

        result += "CORE_WEBHOOKS_HOST=0.0.0.0\n";
        result += `CORE_WEBHOOKS_PORT=${options.coreWebhooksPort}\n\n`;

        result += "CORE_MANAGER_HOST=0.0.0.0\n";
        result += `CORE_MANAGER_PORT=${options.coreMonitorPort}\n\n`;

        return result;
    }

    private generatePeers(options: Options): { list: { ip: string; port: number }[] } {
        if (options.peers === "") {
            return { list: [] };
        }

        const list = options.peers
            .replace(" ", "")
            .split(",")
            .map((peer) => {
                const [ip, port] = peer.split(":");

                return {
                    ip,
                    port: Number.isNaN(parseInt(port)) ? options.coreP2PPort : parseInt(port),
                };
            });

        return { list };
    }

    private generateApp(options: Options): any {
        const dynamicFees: DynamicFees = {
            enabled: undefined,
            minFeePool: undefined,
            minFeeBroadcast: undefined,
            addonBytes: {},
        };

        let includeDynamicFees = false;

        if (options.feeDynamicEnabled) {
            dynamicFees.enabled = options.feeDynamicEnabled;
            includeDynamicFees = true;
        }
        if (options.feeDynamicMinFeePool) {
            dynamicFees.minFeePool = options.feeDynamicMinFeePool;
            includeDynamicFees = true;
        }
        if (options.feeDynamicMinFeeBroadcast) {
            dynamicFees.minFeeBroadcast = options.feeDynamicMinFeeBroadcast;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesTransfer) {
            dynamicFees.addonBytes.transfer = options.feeDynamicBytesTransfer;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesSecondSignature) {
            dynamicFees.addonBytes.secondSignature = options.feeDynamicBytesSecondSignature;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesSecondSignature) {
            dynamicFees.addonBytes.secondSignature = options.feeDynamicBytesSecondSignature;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesDelegateRegistration) {
            dynamicFees.addonBytes.delegateRegistration = options.feeDynamicBytesDelegateRegistration;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesVote) {
            dynamicFees.addonBytes.vote = options.feeDynamicBytesVote;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesMultiSignature) {
            dynamicFees.addonBytes.multiSignature = options.feeDynamicBytesMultiSignature;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesIpfs) {
            dynamicFees.addonBytes.ipfs = options.feeDynamicBytesIpfs;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesMultiPayment) {
            dynamicFees.addonBytes.multiPayment = options.feeDynamicBytesMultiPayment;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesDelegateResignation) {
            dynamicFees.addonBytes.delegateResignation = options.feeDynamicBytesDelegateResignation;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesHtlcLock) {
            dynamicFees.addonBytes.htlcLock = options.feeDynamicBytesHtlcLock;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesHtlcClaim) {
            dynamicFees.addonBytes.htlcClaim = options.feeDynamicBytesHtlcClaim;
            includeDynamicFees = true;
        }
        if (options.feeDynamicBytesHtlcRefund) {
            dynamicFees.addonBytes.htlcRefund = options.feeDynamicBytesHtlcRefund;
            includeDynamicFees = true;
        }

        if (!Object.keys(dynamicFees.addonBytes).length) {
            // @ts-ignore
            delete dynamicFees.addonBytes;
        }

        const app = readJSONSync(resolve(__dirname, "../../bin/config/testnet/app.json"));

        if (includeDynamicFees) {
            app.core.plugins.find((plugin) => plugin.package === "@arkecosystem/core-transaction-pool").options = {
                dynamicFees,
            };

            app.relay.plugins.find((plugin) => plugin.package === "@arkecosystem/core-transaction-pool").options = {
                dynamicFees,
            };
        }

        return app;
    }

    private generateCoreDelegates(activeDelegates: number, pubKeyHash: number): Wallet[] {
        const wallets: Wallet[] = [];
        for (let i = 0; i < activeDelegates; i++) {
            const delegateWallet: Wallet = this.createWallet(pubKeyHash);
            delegateWallet.username = `genesis_${i + 1}`;

            wallets.push(delegateWallet);
        }

        return wallets;
    }

    private createWallet(pubKeyHash: number): Wallet {
        const passphrase = generateMnemonic();

        const keys: Interfaces.IKeyPair = Identities.Keys.fromPassphrase(passphrase);

        return {
            address: Identities.Address.fromPublicKey(keys.publicKey, pubKeyHash),
            passphrase,
            keys,
            username: undefined,
        };
    }

    private createTransferTransaction(
        sender: Wallet,
        recipient: Wallet,
        amount: string,
        pubKeyHash: number,
        nonce: number = 1,
    ): any {
        return this.formatGenesisTransaction(
            Transactions.BuilderFactory.transfer()
                .network(pubKeyHash)
                .version(2)
                .nonce(nonce.toFixed())
                .recipientId(recipient.address)
                .amount(amount)
                .sign(sender.passphrase).data,
            sender,
        );
    }

    private createTransferTransactions(
        sender: Wallet,
        recipients: Wallet[],
        totalPremine: string,
        pubKeyHash: number,
    ): any {
        const amount: string = Utils.BigNumber.make(totalPremine).dividedBy(recipients.length).toString();

        return recipients.map((recipientWallet: Wallet, index: number) =>
            this.createTransferTransaction(sender, recipientWallet, amount, pubKeyHash, index + 1),
        );
    }

    private buildDelegateTransactions(senders: Wallet[], pubKeyHash: number) {
        return senders.map((sender: Wallet) =>
            this.formatGenesisTransaction(
                Transactions.BuilderFactory.delegateRegistration()
                    .network(pubKeyHash)
                    .version(2)
                    .nonce("1") // delegate registration tx is always the first one from sender
                    .usernameAsset(sender.username!)
                    .fee(`${25 * 1e8}`)
                    .sign(sender.passphrase).data,
                sender,
            ),
        );
    }

    private buildVoteTransactions(senders: Wallet[], pubKeyHash: number) {
        return senders.map((sender: Wallet) =>
            this.formatGenesisTransaction(
                Transactions.BuilderFactory.vote()
                    .network(pubKeyHash)
                    .version(2)
                    .nonce("2") // vote transaction is always the 2nd tx from sender (1st one is delegate registration)
                    .votesAsset([`+${sender.keys.publicKey}`])
                    .fee(`${1 * 1e8}`)
                    .sign(sender.passphrase).data,
                sender,
            ),
        );
    }

    private formatGenesisTransaction(transaction, wallet: Wallet) {
        Object.assign(transaction, {
            fee: Utils.BigNumber.ZERO,
            timestamp: 0,
        });
        transaction.signature = Transactions.Signer.sign(transaction, wallet.keys);
        transaction.id = Transactions.Utils.getId(transaction);

        return transaction;
    }

    private createGenesisBlock(keys: Interfaces.IKeyPair, transactions, timestamp: number) {
        transactions = transactions.sort((a, b) => {
            if (a.type === b.type) {
                return a.amount - b.amount;
            }

            return a.type - b.type;
        });

        let payloadLength = 0;
        let totalFee: Utils.BigNumber = Utils.BigNumber.ZERO;
        let totalAmount: Utils.BigNumber = Utils.BigNumber.ZERO;
        const allBytes: Buffer[] = [];

        for (const transaction of transactions) {
            const bytes: Buffer = Transactions.Serializer.getBytes(transaction);

            allBytes.push(bytes);

            payloadLength += bytes.length;
            totalFee = totalFee.plus(transaction.fee);
            totalAmount = totalAmount.plus(Utils.BigNumber.make(transaction.amount));
        }

        const payloadHash: Buffer = Crypto.HashAlgorithms.sha256(Buffer.concat(allBytes));

        const block: any = {
            version: 0,
            totalAmount: totalAmount.toString(),
            totalFee: totalFee.toString(),
            reward: "0",
            payloadHash: payloadHash.toString("hex"),
            timestamp,
            numberOfTransactions: transactions.length,
            payloadLength,
            previousBlock: "0000000000000000000000000000000000000000000000000000000000000000",
            // @ts-ignore
            generatorPublicKey: keys.publicKey.toString("hex"),
            transactions,
            height: 1,
            id: undefined,
            blockSignature: undefined,
        };

        block.id = Blocks.Block.getId(block);

        block.blockSignature = this.signBlock(block, keys);

        return block;
    }

    private signBlock(block, keys: Interfaces.IKeyPair): string {
        return Crypto.Hash.signECDSA(this.getHash(block), keys);
    }

    private getHash(block): Buffer {
        return Crypto.HashAlgorithms.sha256(Blocks.Serializer.serialize(block, false));
    }
}
