import { Crypto, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import { generateMnemonic } from "bip39";
import ByteBuffer from "bytebuffer";
import { copyFileSync, ensureDirSync, existsSync, writeFileSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";

import { abort } from "../../common/cli";
import { TaskService } from "../../common/task.service";
import { CommandFlags } from "../../types";

interface Wallet {
    address: string;
    passphrase: string;
    keys: Interfaces.IKeyPair;
    username: string | undefined;
}

// todo: review implementation - nOS previously reported some issues
export class GenerateCommand extends Command {
    public static description = "Generates a new network configuration";

    public static examples: string[] = [
        `Generates a new network configuration
$ ark network:generate --network=mynet7 --premine=120000000000 --delegates=47 --blocktime=9 --maxTxPerBlock=122 --maxBlockPayload=123444 --rewardHeight=23000 --rewardAmount=66000 --pubKeyHash=168 --wif=27 --token=myn --symbol=my --explorer=myex.io
`,
    ];

    public static flags: CommandFlags = {
        network: flags.string({
            description: "the name of the network that should be used",
        }),
        premine: flags.string({
            description: "the amount of token pre-mined",
            default: "12500000000000000",
        }),
        delegates: flags.integer({
            description: "the number of delegates to generate",
            default: 51,
        }),
        blocktime: flags.integer({
            description: "the network blocktime",
            default: 8,
        }),
        maxTxPerBlock: flags.integer({
            description: "the maximum number of transactions per block",
            default: 150,
        }),
        maxBlockPayload: flags.integer({
            description: "the maximum payload length by block",
            default: 2097152,
        }),
        rewardHeight: flags.integer({
            description: "the height at which the delegate block reward kicks in",
            default: 75600,
        }),
        rewardAmount: flags.integer({
            description: "the amount of the block reward",
            default: 200000000,
        }),
        pubKeyHash: flags.integer({
            description: "the public key hash",
        }),
        wif: flags.integer({
            description: "the WIF that should be used",
        }),
        token: flags.string({
            description: "the token name that should be used",
        }),
        symbol: flags.string({
            description: "the symbol that should be used",
        }),
        explorer: flags.string({
            description: "the explorer url that should be used",
        }),
        distribute: flags.boolean({
            description: "distribute the premine evenly between all delegates",
            default: false,
        }),
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(GenerateCommand);

        if (!Object.keys(GenerateCommand.flags).find(flagName => !flags[flagName])) {
            return this.generateNetwork(flags);
        }

        const stringFlags: string[] = ["network", "premine", "token", "symbol", "explorer"];
        const response = await prompts(
            Object.keys(GenerateCommand.flags)
                .map(
                    flagName =>
                        ({
                            type: stringFlags.includes(flagName) ? "text" : "number",
                            name: flagName,
                            message: GenerateCommand.flags[flagName].description,
                            initial: `${flags[flagName]}`,
                        } as prompts.PromptObject<string>),
                )
                .concat({
                    type: "confirm",
                    name: "confirm",
                    message: "Can you confirm?",
                } as prompts.PromptObject<string>),
        );

        if (Object.keys(GenerateCommand.flags).find(flagName => !response[flagName])) {
            abort("Please provide all flags and try again!");
        }

        if (!response.confirm) {
            abort("You'll need to confirm the input to continue.");
        }

        await this.generateNetwork({ ...flags, ...response });
    }

    private async generateNetwork(flags: CommandFlags): Promise<void> {
        const coreConfigDest: string = resolve(__dirname, `../../../bin/config/${flags.network}`);
        const cryptoConfigDest: string = resolve(__dirname, `../../../../crypto/src/networks/${flags.network}`);

        const delegates: any[] = this.generateCoreDelegates(flags.delegates, flags.pubKeyHash);

        const tasks: TaskService = new TaskService();
        tasks.add("Prepare directories", async () => {
            if (existsSync(coreConfigDest)) {
                throw new Error(`${coreConfigDest} already exists.`);
            }

            if (existsSync(cryptoConfigDest)) {
                throw new Error(`${cryptoConfigDest} already exists.`);
            }

            ensureDirSync(coreConfigDest);
            ensureDirSync(cryptoConfigDest);
        });

        tasks.add("Generate crypto network configuration", async () => {
            const genesisBlock = this.generateCryptoGenesisBlock(
                this.createWallet(flags.pubKeyHash),
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
        });

        tasks.add("Generate core network configuration", async () => {
            writeJSONSync(resolve(coreConfigDest, "peers.json"), { list: [] }, { spaces: 4 });

            writeJSONSync(
                resolve(coreConfigDest, "delegates.json"),
                { secrets: delegates.map(d => d.passphrase) },
                { spaces: 4 },
            );

            copyFileSync(resolve(coreConfigDest, "../testnet/.env"), resolve(coreConfigDest, ".env"));

            copyFileSync(resolve(coreConfigDest, "../testnet/app.js"), resolve(coreConfigDest, "app.js"));
        });

        await tasks.run();
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
        rewardAmount: number,
    ) {
        return [
            {
                height: 1,
                reward: 0,
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
                multiPaymentLimit: 500,
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

    private createWallet(pubKeyHash: number, passphrase?: string): Wallet {
        if (!passphrase) {
            passphrase = generateMnemonic();
        }

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
        const amount: string = Utils.BigNumber.make(totalPremine)
            .dividedBy(recipients.length)
            .toString();

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

        /* istanbul ignore next */
        if (genesisBlock.blockSignature) {
            for (const blockSignatureByte of Buffer.from(genesisBlock.blockSignature, "hex")) {
                byteBuffer.writeByte(blockSignatureByte);
            }
        }

        byteBuffer.flip();

        return byteBuffer.toBuffer();
    }
}
