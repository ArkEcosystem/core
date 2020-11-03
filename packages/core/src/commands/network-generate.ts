import { Commands, Container, Contracts } from "@arkecosystem/core-cli";
import { Crypto, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";
import { generateMnemonic } from "bip39";
import ByteBuffer from "bytebuffer";
import envPaths from "env-paths";
import { copyFileSync, ensureDirSync, existsSync, writeFileSync, writeJSONSync } from "fs-extra";
import { join, resolve } from "path";
import prompts from "prompts";

interface Wallet {
    address: string;
    passphrase: string;
    keys: Interfaces.IKeyPair;
    username: string | undefined;
}

/*
Network:
- network Required
- premine Required "12500000000000000"
- delegates Required 51
- blocktime Required 8
- maxTxPerBlock Required 150
- maxBlockPayload Required 2097152
- pubKeyHash Required
- wif Required
- token Required
- symbol Required
- explorer Required ????

- rewardHeight 75600
- rewardAmount "200000000"

- epoch
- vendorFieldLength

Other:
- htlcEnabled

Fees:
- feeStaticTransfer
- feeStaticSecondSignature
- feeStaticDelegateRegistration
- feeStaticVote
- feeStaticMultiSignature
- feeStaticIpfs
- feeStaticMultiPayment
- feeStaticDelegateResignation
- feeStaticHtlcLock
- feeStaticHtlcClaim
- feeStaticHtlcRefund



- feeDynamicEnabled ???
- feeDynamicBroadcastMinFee ???
- feeDynamicBytesTransfer
- feeDynamicBytesSecondSignature
- feeDynamicBytesDelegateRegistration
- feeDynamicBytesVote
- feeDynamicBytesMultiSignature
- feeDynamicBytesIpfs
- feeDynamicBytesMultiPayment
- feeDynamicBytesDelegateResignation

Gensis:
- distribute Required false

Env:
- coreIp
- p2pPort
- apiPort
- webhookPort
- jsonRpcPort ???

- dbHost
- dbPort
- dbUsername
- dbPassword
- dbDatabase

Settings:
- peers
- prefixHash ???


General:
- configPath
- overwriteConfig
- force

 */

interface Flag {
    name: string;
    description: string;
    schema: Joi.Schema;
    required: boolean;
    promptType: string;
    default?: any;
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
}

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
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
        { name: "network", description: "The name of the network.", schema: Joi.string(), required: true, promptType: "text" },
        { name: "premine", description: "The number of pre-mined tokens.", schema: Joi.alternatives().try(Joi.string(), Joi.number()), required: true, promptType: "text", default: "12500000000000000" },
        { name: "delegates", description: "The number of delegates to generate.", schema: Joi.number(), required: true, promptType: "number", default: 51 },
        { name: "blocktime", description: "The network blocktime.", schema: Joi.number(), required: true, promptType: "number", default: 8 },
        { name: "maxTxPerBlock", description: "The maximum number of transactions per block.", schema: Joi.number(), required: true, promptType: "number", default: 150 },
        { name: "maxBlockPayload", description: "The maximum payload length by block.", schema: Joi.number(), required: true, promptType: "number", default: 2097152 },
        { name: "rewardHeight", description: "The height at which delegate block reward starts.", schema: Joi.number(), required: true, promptType: "number", default: 75600 },
        { name: "rewardAmount", description: "The number of the block reward per forged block.", schema: Joi.alternatives().try(Joi.string(), Joi.number()), required: true, promptType: "number", default: "200000000" },
        { name: "pubKeyHash", description: "The public key hash.", schema: Joi.number(), required: true, promptType: "number" },
        { name: "wif", description: "The WIF (Wallet Import Format) that should be used.", schema: Joi.number(), required: true, promptType: "number" },
        { name: "token", description: "The name that is attributed to the token on the network.", schema: Joi.string(), required: true, promptType: "text" },
        { name: "symbol", description: "The character that is attributed to the token on the network.", schema: Joi.string(), required: true, promptType: "text" },
        { name: "explorer", description: "The URL that hosts the network explorer.", schema: Joi.string(), required: true, promptType: "text" },
        { name: "distribute", description: "Distribute the premine evenly between all delegates?", schema: Joi.string(), required: true, promptType: "confirm", default: false },
        { name: "epoch", description: "Start time of the network. (optional)", schema: Joi.string(), required: true, promptType: "date", default: new Date(Date.now()) },
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
        // const flagsDefinition = this.definition.getFlags();

        const flags: Contracts.AnyObject = this.getFlags();

        const allFlagsSet = !this.flagSettings.find((flag) => flags[flag.name] === undefined);

        if (allFlagsSet) {
            return this.generateNetwork(flags as Options);
        }

        const response = await prompts(
            this.flagSettings
                .filter((flag) => flag.required)
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

        const options = {
            ...flags,
            ...response,
        };

        // if (Object.keys(flagsDefinityarn ion).find((flagName) => response[flagName] === undefined)) {
        //     throw new Error("Please provide all flags and try again!");
        // }

        if (!response.confirm) {
            throw new Error("You'll need to confirm the input to continue.");
        }

        for (const flag of this.flagSettings.filter((flag) => flag.required)) {
            if (flag.promptType === "text" && options[flag.name] !== "undefined") {
                continue;
            }

            if (flag.promptType === "number" && !Number.isNaN(options[flag.name])) {
                continue;
            }

            if (["confirm", "date"].includes(flag.promptType)) {
                continue;
            }

            throw new Error(`Flag ${flag.name} is required.`);
        }

        await this.generateNetwork({ ...flags, ...response });
    }

    private async generateNetwork(flags: Options): Promise<void> {
        const paths = envPaths(flags.token, { suffix: "core" });
        const coreConfigDest = join(paths.config, flags.network);
        const cryptoConfigDest = join(coreConfigDest, "crypto");

        const delegates: any[] = this.generateCoreDelegates(flags.delegates, flags.pubKeyHash);

        const genesisWallet = this.createWallet(flags.pubKeyHash);

        await this.components.taskList([
            {
                title: "Prepare directories.",
                task: async () => {
                    if (existsSync(coreConfigDest)) {
                        throw new Error(`${coreConfigDest} already exists.`);
                    }

                    if (existsSync(cryptoConfigDest)) {
                        throw new Error(`${cryptoConfigDest} already exists.`);
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
                    writeJSONSync(resolve(coreConfigDest, "peers.json"), { list: [] }, { spaces: 4 });

                    writeJSONSync(
                        resolve(coreConfigDest, "delegates.json"),
                        { secrets: delegates.map((d) => d.passphrase) },
                        { spaces: 4 },
                    );

                    copyFileSync(resolve(__dirname, "../../bin/config/testnet/.env"), resolve(coreConfigDest, ".env"));

                    copyFileSync(
                        resolve(__dirname, "../../bin/config/testnet/app.json"),
                        resolve(coreConfigDest, "app.json"),
                    );
                },
            },
        ]);
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
        return [
            {
                height: 1,
                reward: "0",
                activeDelegates: options.delegates,
                blocktime: options.blocktime,
                block: {
                    version: 0,
                    maxTransactions: options.maxTxPerBlock,
                    maxPayload: options.maxBlockPayload,
                },
                epoch: options.epoch.toISOString(),
                fees: {
                    staticFees: {
                        transfer: 10000000,
                        secondSignature: 500000000,
                        delegateRegistration: 2500000000,
                        vote: 100000000,
                        multiSignature: 500000000,
                        ipfs: 500000000,
                        multiPayment: 10000000,
                        delegateResignation: 2500000000,
                        htlcLock: 10000000,
                        htlcClaim: 0,
                        htlcRefund: 0,
                    },
                },
                vendorFieldLength: 64,
                multiPaymentLimit: 256,
                aip11: true,
            },
            {
                height: options.rewardHeight,
                reward: options.rewardAmount,
            },
            {
                height: 100000,
                vendorFieldLength: 255,
            },
            {
                height: 4000000,
                block: {
                    idFullSha256: true,
                },
            },
        ];
    }

    private generateCryptoGenesisBlock(genesisWallet, delegates, options: Options) {
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

    private createTransferTransaction(sender: Wallet, recipient: Wallet, amount: string, pubKeyHash: number): any {
        return this.formatGenesisTransaction(
            Transactions.BuilderFactory.transfer()
                .network(pubKeyHash)
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

        return recipients.map((recipientWallet: Wallet) =>
            this.createTransferTransaction(sender, recipientWallet, amount, pubKeyHash),
        );
    }

    private buildDelegateTransactions(senders: Wallet[], pubKeyHash: number) {
        return senders.map((sender: Wallet) =>
            this.formatGenesisTransaction(
                Transactions.BuilderFactory.delegateRegistration()
                    .network(pubKeyHash)
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
                    .votesAsset([`+${sender.keys.publicKey}`])
                    .fee(`${1 * 1e8}`)
                    .sign(sender.passphrase).data,
                sender,
            ),
        );
    }

    private formatGenesisTransaction(transaction, wallet: Wallet) {
        Object.assign(transaction, {
            fee: "0",
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
            previousBlock: null,
            // @ts-ignore
            generatorPublicKey: keys.publicKey.toString("hex"),
            transactions,
            height: 1,
            id: undefined,
            blockSignature: undefined,
        };

        block.id = this.getBlockId(block);

        block.blockSignature = this.signBlock(block, keys);

        return block;
    }

    private getBlockId(block): string {
        const hash: Buffer = this.getHash(block);
        const blockBuffer: Buffer = Buffer.alloc(8);

        for (let i = 0; i < 8; i++) {
            blockBuffer[i] = hash[7 - i];
        }

        return Utils.BigNumber.make(`0x${blockBuffer.toString("hex")}`).toString();
    }

    private signBlock(block, keys: Interfaces.IKeyPair): string {
        return Crypto.Hash.signECDSA(this.getHash(block), keys);
    }

    private getHash(block): Buffer {
        return Crypto.HashAlgorithms.sha256(this.getBytes(block));
    }

    private getBytes(genesisBlock): Buffer {
        const size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 32 + 64;

        const byteBuffer = new ByteBuffer(size, true);
        byteBuffer.writeInt(genesisBlock.version);
        byteBuffer.writeInt(genesisBlock.timestamp);
        byteBuffer.writeInt(genesisBlock.height);

        for (let i = 0; i < 8; i++) {
            byteBuffer.writeByte(0); // no previous block
        }

        byteBuffer.writeInt(genesisBlock.numberOfTransactions);
        byteBuffer.writeLong(genesisBlock.totalAmount);
        byteBuffer.writeLong(genesisBlock.totalFee);
        byteBuffer.writeLong(genesisBlock.reward);

        byteBuffer.writeInt(genesisBlock.payloadLength);

        for (const payloadHashByte of Buffer.from(genesisBlock.payloadHash, "hex")) {
            byteBuffer.writeByte(payloadHashByte);
        }

        for (const generatorByte of Buffer.from(genesisBlock.generatorPublicKey, "hex")) {
            byteBuffer.writeByte(generatorByte);
        }

        byteBuffer.flip();

        return byteBuffer.toBuffer();
    }
}
