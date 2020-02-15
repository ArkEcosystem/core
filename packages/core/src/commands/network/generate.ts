import { Crypto, Identities, Transactions, Utils } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { generateMnemonic } from "bip39";
import ByteBuffer from "bytebuffer";
import fs from "fs-extra";
import { resolve } from "path";
import prompts from "prompts";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class GenerateCommand extends BaseCommand {
    public static description: string = "Generates a new network configuration";

    public static examples: string[] = [
        `Generates a new network configuration
$ ark config:generate --network=mynet7 --premine=120000000000 --delegates=47 --blocktime=9 --maxTxPerBlock=122 --maxBlockPayload=123444 --rewardHeight=23000 --rewardAmount=66000 --pubKeyHash=168 --wif=27 --token=myn --symbol=my --explorer=myex.io
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
    };

    public async run(): Promise<void> {
        const { flags } = this.parse(GenerateCommand);

        if (!Object.keys(GenerateCommand.flags).find(flagName => !flags[flagName])) {
            // all the flags are filled, we can generate network
            return this.generateNetwork(flags);
        }

        const stringFlags = ["network", "premine", "token", "symbol", "explorer"];
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
                } as prompts.PromptObject<string>) as Array<prompts.PromptObject<string>>,
        );

        if (Object.keys(GenerateCommand.flags).find(flagName => !response[flagName])) {
            // one of the flags was not filled, we can't continue
            return this.abortWithInvalidInput();
        }

        if (response.confirm) {
            return this.generateNetwork({ ...flags, ...response });
        }
    }

    private async generateNetwork(flags: CommandFlags): Promise<void> {
        const coreConfigDest = resolve(__dirname, `../../../bin/config/${flags.network}`);
        const cryptoConfigDest = resolve(__dirname, `../../../../crypto/src/networks/${flags.network}`);

        const delegates = this.generateCoreDelegates(flags.delegates, flags.pubKeyHash);
        let genesisWallet;

        this.addTask("Prepare directories", async () => {
            if (fs.existsSync(coreConfigDest)) {
                this.error(`${coreConfigDest} already exists.`);
            }
            if (fs.existsSync(cryptoConfigDest)) {
                this.error(`${cryptoConfigDest} already exists.`);
            }

            fs.ensureDirSync(coreConfigDest);
            fs.ensureDirSync(cryptoConfigDest);
        });

        this.addTask(`Generate genesis wallet and persist to genesis-wallet.json in core config path`, async () => {
            genesisWallet = this.createWallet(flags.pubKeyHash);
            fs.writeJsonSync(resolve(coreConfigDest, "genesis-wallet.json"), genesisWallet, { spaces: 2 });
        });

        this.addTask("Generate crypto network configuration", async () => {
            const genesisBlock = this.generateCryptoGenesisBlock(
                genesisWallet,
                delegates,
                flags.pubKeyHash,
                flags.premine,
            );

            const network = this.generateCryptoNetwork(
                flags.network,
                flags.pubKeyHash,
                genesisBlock.payloadHash,
                flags.wif,
                flags.token,
                flags.symbol,
                flags.explorer,
            );

            const milestones = this.generateCryptoMilestones(
                flags.delegates,
                flags.blocktime,
                flags.maxTxPerBlock,
                flags.maxBlockPayload,
                flags.rewardHeight,
                flags.rewardAmount,
            );

            fs.writeJsonSync(resolve(cryptoConfigDest, "network.json"), network, { spaces: 2 });
            fs.writeJsonSync(resolve(cryptoConfigDest, "milestones.json"), milestones, { spaces: 2 });
            fs.writeJsonSync(resolve(cryptoConfigDest, "genesisBlock.json"), genesisBlock, { spaces: 2 });
            fs.writeJsonSync(resolve(cryptoConfigDest, "exceptions.json"), {});

            const indexFile = [
                'import exceptions from "./exceptions.json";',
                'import genesisBlock from "./genesisBlock.json";',
                'import milestones from "./milestones.json";',
                'import network from "./network.json";',
                "",
                `export const ${flags.network} = { exceptions, genesisBlock, milestones, network };`,
            ];
            fs.writeFileSync(resolve(cryptoConfigDest, "index.ts"), indexFile.join("\n"));
        });

        this.addTask("Generate core network configuration", async () => {
            fs.writeJsonSync(resolve(coreConfigDest, "peers.json"), { list: [] }, { spaces: 2 });
            fs.writeJsonSync(
                resolve(coreConfigDest, "delegates.json"),
                { secrets: delegates.map(d => d.passphrase) },
                { spaces: 2 },
            );
            fs.copyFileSync(resolve(coreConfigDest, "../testnet/.env"), resolve(coreConfigDest, ".env"));
            fs.copyFileSync(resolve(coreConfigDest, "../testnet/plugins.js"), resolve(coreConfigDest, "plugins.js"));
        });

        await this.runTasks();
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
        maxTxPerBlock: number,
        maxBlockPayload: number,
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
                    maxTransactions: maxTxPerBlock,
                    maxPayload: maxBlockPayload,
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
                        multiPayment: 0,
                        delegateResignation: 2500000000,
                    },
                },
                vendorFieldLength: 64,
                aip11: true,
            },
            {
                height: rewardHeight,
                reward: rewardAmount,
            },
        ];
    }

    private generateCryptoGenesisBlock(genesisWallet, delegates, pubKeyHash: number, totalPremine: string) {
        const premineWallet = this.createWallet(pubKeyHash);

        const transactions = [
            ...this.buildDelegateTransactions(delegates),
            this.createTransferTransaction(premineWallet, genesisWallet, totalPremine),
        ];

        const genesisBlock = this.createGenesisBlock(premineWallet.keys, transactions, 0);

        return genesisBlock;
    }

    private generateCoreDelegates(activeDelegates: number, pubKeyHash: number) {
        const wallets = [];
        for (let i = 0; i < activeDelegates; i++) {
            const delegateWallet = this.createWallet(pubKeyHash);
            delegateWallet.username = `genesis_${i + 1}`;
            wallets.push(delegateWallet);
        }

        return wallets;
    }

    private createWallet(pubKeyHash: number) {
        const passphrase = generateMnemonic();
        const keys = Identities.Keys.fromPassphrase(passphrase);

        return {
            address: Identities.Address.fromPublicKey(keys.publicKey, pubKeyHash),
            passphrase,
            keys,
            username: undefined,
        };
    }

    private buildDelegateTransactions(delegatesWallets) {
        return delegatesWallets.map(w => {
            const { data: transaction } = Transactions.BuilderFactory.delegateRegistration()
                .usernameAsset(w.username)
                .fee(`${25 * 10e8}`)
                .sign(w.passphrase);

            return this.formatGenesisTransaction(transaction, w);
        });
    }

    private createTransferTransaction(senderWallet, receiverWallet, amount) {
        const { data: transaction } = Transactions.BuilderFactory.transfer()
            .recipientId(receiverWallet.address)
            .amount(amount)
            .sign(senderWallet.passphrase);

        return this.formatGenesisTransaction(transaction, senderWallet);
    }

    private formatGenesisTransaction(transaction, wallet) {
        Object.assign(transaction, {
            fee: "0",
            timestamp: 0,
        });
        transaction.signature = Transactions.Signer.sign(transaction, wallet.keys);
        transaction.id = Transactions.Utils.getId(transaction);

        return transaction;
    }

    private createGenesisBlock(keys, transactions, timestamp) {
        transactions = transactions.sort((a, b) => {
            if (a.type === b.type) {
                return a.amount - b.amount;
            }

            return a.type - b.type;
        });

        let payloadLength = 0;
        let totalFee = Utils.BigNumber.ZERO;
        let totalAmount = Utils.BigNumber.ZERO;
        const allBytes = [];

        for (const transaction of transactions) {
            const bytes = Transactions.Serializer.getBytes(transaction);
            allBytes.push(bytes);
            payloadLength += bytes.length;
            totalFee = totalFee.plus(new Utils.BigNumber(transaction.fee));
            totalAmount = totalAmount.plus(new Utils.BigNumber(transaction.amount));
        }

        const payloadHash = Crypto.HashAlgorithms.sha256(Buffer.concat(allBytes));

        const block = {
            version: 0,
            totalAmount: totalAmount.toString(),
            totalFee: totalFee.toString(),
            reward: "0",
            payloadHash: payloadHash.toString("hex"),
            timestamp,
            numberOfTransactions: transactions.length,
            payloadLength,
            previousBlock: null, // tslint:disable-line
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

    private getBlockId(block) {
        const hash = this.getHash(block);
        const blockBuffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            blockBuffer[i] = hash[7 - i];
        }

        return Utils.BigNumber.make(`0x${blockBuffer.toString("hex")}`).toString();
    }

    private signBlock(block, keys) {
        const hash = this.getHash(block);
        return Crypto.Hash.signECDSA(hash, keys);
    }

    private getHash(block) {
        return Crypto.HashAlgorithms.sha256(this.getBytes(block));
    }

    private getBytes(genesisBlock) {
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

        const payloadHashBuffer = Buffer.from(genesisBlock.payloadHash, "hex");
        for (const payloadHashByte of payloadHashBuffer) {
            byteBuffer.writeByte(payloadHashByte);
        }

        const generatorPublicKeyBuffer = Buffer.from(genesisBlock.generatorPublicKey, "hex");

        for (const generatorByte of generatorPublicKeyBuffer) {
            byteBuffer.writeByte(generatorByte);
        }

        if (genesisBlock.blockSignature) {
            const blockSignatureBuffer = Buffer.from(genesisBlock.blockSignature, "hex");
            for (const blockSignatureByte of blockSignatureBuffer) {
                byteBuffer.writeByte(blockSignatureByte);
            }
        }

        byteBuffer.flip();
        const buffer = byteBuffer.toBuffer();

        return buffer;
    }
}
