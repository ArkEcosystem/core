import { Commands, Container, Contracts } from "@arkecosystem/core-cli";
import { Crypto, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";
import { generateMnemonic } from "bip39";
import ByteBuffer from "bytebuffer";
import { copyFileSync, ensureDirSync, existsSync, writeFileSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";

interface Wallet {
    address: string;
    passphrase: string;
    keys: Interfaces.IKeyPair;
    username: string | undefined;
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

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition
            .setFlag("network", "The name of the network.", Joi.string())
            .setFlag(
                "premine",
                "The number of pre-mined tokens.",
                Joi.alternatives().try(Joi.string(), Joi.number()).default("12500000000000000"),
            )
            .setFlag("delegates", "The number of delegates to generate.", Joi.number().default(51))
            .setFlag("blocktime", "The network blocktime.", Joi.number().default(8))
            .setFlag("maxTxPerBlock", "The maximum number of transactions per block.", Joi.number().default(150))
            .setFlag("maxBlockPayload", "The maximum payload length by block.", Joi.number().default(2097152))
            .setFlag("rewardHeight", "The height at which delegate block reward starts.", Joi.number().default(75600))
            .setFlag(
                "rewardAmount",
                "The number of the block reward per forged block.",
                Joi.alternatives().try(Joi.string(), Joi.number()).default("200000000"),
            )
            .setFlag("pubKeyHash", "The public key hash.", Joi.number())
            .setFlag("wif", "The WIF (Wallet Import Format) that should be used.", Joi.number())
            .setFlag("token", "The name that is attributed to the token on the network.", Joi.string())
            .setFlag("symbol", "The character that is attributed to the token on the network.", Joi.string())
            .setFlag("explorer", "The URL that hosts the network explorer.", Joi.string())
            .setFlag(
                "distribute",
                "Distribute the premine evenly between all delegates?",
                Joi.boolean().default(false),
            );
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const flagsDefinition = this.definition.getFlags();

        const flags: Contracts.AnyObject = this.getFlags();

        if (!Object.keys(flagsDefinition).find((flagName) => !flags[flagName])) {
            return this.generateNetwork(flags);
        }

        const stringFlags: string[] = ["network", "premine", "token", "symbol", "explorer"];
        const response = await prompts(
            Object.keys(flagsDefinition)
                .map(
                    (flagName) =>
                        ({
                            type: stringFlags.includes(flagName) ? "text" : "number",
                            name: flagName,
                            message: flagsDefinition[flagName].description,
                            initial: `${flags[flagName]}`,
                        } as prompts.PromptObject<string>),
                )
                .concat({
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                } as prompts.PromptObject<string>),
        );

        // TODO: check this fix is acceptable
        // the distribute flag is a boolean in the pre-existing tests
        // and it is defined as a number in this.generateCryptoGenesisBlock()
        // If false or 0 are passed intentionally, this would fail (despite all flags being provided).
        if (Object.keys(flagsDefinition).find((flagName) => response[flagName] === undefined)) {
            this.components.fatal("Please provide all flags and try again!");
        }

        if (!response.confirm) {
            this.components.fatal("You'll need to confirm the input to continue.");
        }

        await this.generateNetwork({ ...flags, ...response });
    }

    private async generateNetwork(flags: Contracts.AnyObject): Promise<void> {
        const coreConfigDest: string = resolve(__dirname, `../../bin/config/${flags.network}`);
        const cryptoConfigDest: string = resolve(__dirname, `../../../crypto/src/networks/${flags.network}`);

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
                    const genesisBlock = this.generateCryptoGenesisBlock(
                        genesisWallet,
                        delegates,
                        flags.pubKeyHash,
                        flags.premine,
                        flags.distribute,
                    );

                    writeJSONSync(
                        resolve(cryptoConfigDest, "network.json"),
                        this.generateCryptoNetwork(
                            flags.network,
                            flags.pubKeyHash,
                            genesisBlock.payloadHash,
                            flags.wif,
                            flags.token,
                            flags.symbol,
                            flags.explorer,
                        ),
                        { spaces: 4 },
                    );

                    writeJSONSync(
                        resolve(cryptoConfigDest, "milestones.json"),
                        this.generateCryptoMilestones(
                            flags.delegates,
                            flags.blocktime,
                            flags.maxTxPerBlock,
                            flags.maxBlockPayload,
                            flags.rewardHeight,
                            flags.rewardAmount,
                        ),
                        { spaces: 4 },
                    );

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

                    copyFileSync(resolve(coreConfigDest, "../testnet/.env"), resolve(coreConfigDest, ".env"));

                    copyFileSync(resolve(coreConfigDest, "../testnet/app.json"), resolve(coreConfigDest, "app.json"));
                },
            },
        ]);
    }

    private generateCryptoNetwork(
        name: string,
        pubKeyHash: number,
        nethash: string,
        wif: number,
        token: string,
        symbol: string,
        explorer: string,
    ) {
        return {
            name,
            messagePrefix: `${name} message:\n`,
            bip32: {
                public: 70617039,
                private: 70615956,
            },
            pubKeyHash,
            nethash,
            wif,
            slip44: 1,
            aip20: 0,
            client: {
                token,
                symbol,
                explorer,
            },
        };
    }

    private generateCryptoMilestones(
        activeDelegates: number,
        blocktime: number,
        maxTransactions: number,
        maxPayload: number,
        rewardHeight: number,
        rewardAmount: string,
    ) {
        return [
            {
                height: 1,
                reward: "0",
                activeDelegates,
                blocktime,
                block: {
                    version: 0,
                    maxTransactions,
                    maxPayload,
                },
                epoch: "2017-03-21T13:00:00.000Z",
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
                height: rewardHeight,
                reward: rewardAmount,
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

    private generateCryptoGenesisBlock(
        genesisWallet,
        delegates,
        pubKeyHash: number,
        totalPremine: string,
        distribute: number,
    ) {
        const premineWallet: Wallet = this.createWallet(pubKeyHash);

        let transactions = [];

        if (distribute) {
            transactions = transactions.concat(
                ...this.createTransferTransactions(premineWallet, delegates, totalPremine, pubKeyHash),
            );
        } else {
            transactions = transactions.concat(
                this.createTransferTransaction(premineWallet, genesisWallet, totalPremine, pubKeyHash),
            );
        }

        transactions = transactions.concat(
            ...this.buildDelegateTransactions(delegates, pubKeyHash),
            ...this.buildVoteTransactions(delegates, pubKeyHash),
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
