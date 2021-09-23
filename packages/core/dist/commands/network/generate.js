"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const command_1 = require("@oclif/command");
const bip39_1 = require("bip39");
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const prompts_1 = __importDefault(require("prompts"));
const command_2 = require("../command");
class GenerateCommand extends command_2.BaseCommand {
    async run() {
        const { flags } = this.parse(GenerateCommand);
        if (!Object.keys(GenerateCommand.flags).find(flagName => !flags[flagName])) {
            // all the flags are filled, we can generate network
            return this.generateNetwork(flags);
        }
        const stringFlags = ["network", "premine", "token", "symbol", "explorer"];
        const response = await prompts_1.default(Object.keys(GenerateCommand.flags)
            .map(flagName => ({
            type: stringFlags.includes(flagName) ? "text" : "number",
            name: flagName,
            message: GenerateCommand.flags[flagName].description,
            initial: `${flags[flagName]}`,
        }))
            .concat({
            type: "confirm",
            name: "confirm",
            message: "Can you confirm?",
        }));
        if (Object.keys(GenerateCommand.flags).find(flagName => !response[flagName])) {
            // one of the flags was not filled, we can't continue
            return this.abortWithInvalidInput();
        }
        if (response.confirm) {
            return this.generateNetwork({ ...flags, ...response });
        }
    }
    async generateNetwork(flags) {
        const coreConfigDest = path_1.resolve(__dirname, `../../../bin/config/${flags.network}`);
        const cryptoConfigDest = path_1.resolve(__dirname, `../../../../crypto/src/networks/${flags.network}`);
        const delegates = this.generateCoreDelegates(flags.delegates, flags.pubKeyHash);
        let genesisWallet;
        this.addTask("Prepare directories", async () => {
            if (fs_extra_1.default.existsSync(coreConfigDest)) {
                this.error(`${coreConfigDest} already exists.`);
            }
            if (fs_extra_1.default.existsSync(cryptoConfigDest)) {
                this.error(`${cryptoConfigDest} already exists.`);
            }
            fs_extra_1.default.ensureDirSync(coreConfigDest);
            fs_extra_1.default.ensureDirSync(cryptoConfigDest);
        });
        this.addTask(`Generate genesis wallet and persist to genesis-wallet.json in core config path`, async () => {
            genesisWallet = this.createWallet(flags.pubKeyHash);
            fs_extra_1.default.writeJsonSync(path_1.resolve(coreConfigDest, "genesis-wallet.json"), genesisWallet, { spaces: 2 });
        });
        this.addTask("Generate crypto network configuration", async () => {
            const genesisBlock = this.generateCryptoGenesisBlock(genesisWallet, delegates, flags.pubKeyHash, flags.premine);
            const network = this.generateCryptoNetwork(flags.network, flags.pubKeyHash, genesisBlock.payloadHash, flags.wif, flags.token, flags.symbol, flags.explorer);
            const milestones = this.generateCryptoMilestones(flags.delegates, flags.blocktime, flags.maxTxPerBlock, flags.maxBlockPayload, flags.rewardHeight, flags.rewardAmount);
            fs_extra_1.default.writeJsonSync(path_1.resolve(cryptoConfigDest, "network.json"), network, { spaces: 2 });
            fs_extra_1.default.writeJsonSync(path_1.resolve(cryptoConfigDest, "milestones.json"), milestones, { spaces: 2 });
            fs_extra_1.default.writeJsonSync(path_1.resolve(cryptoConfigDest, "genesisBlock.json"), genesisBlock, { spaces: 2 });
            fs_extra_1.default.writeJsonSync(path_1.resolve(cryptoConfigDest, "exceptions.json"), {});
            const indexFile = [
                'import exceptions from "./exceptions.json";',
                'import genesisBlock from "./genesisBlock.json";',
                'import milestones from "./milestones.json";',
                'import network from "./network.json";',
                "",
                `export const ${flags.network} = { exceptions, genesisBlock, milestones, network };`,
            ];
            fs_extra_1.default.writeFileSync(path_1.resolve(cryptoConfigDest, "index.ts"), indexFile.join("\n"));
        });
        this.addTask("Generate core network configuration", async () => {
            fs_extra_1.default.writeJsonSync(path_1.resolve(coreConfigDest, "peers.json"), { list: [] }, { spaces: 2 });
            fs_extra_1.default.writeJsonSync(path_1.resolve(coreConfigDest, "delegates.json"), { secrets: delegates.map(d => d.passphrase) }, { spaces: 2 });
            fs_extra_1.default.copyFileSync(path_1.resolve(coreConfigDest, "../testnet/.env"), path_1.resolve(coreConfigDest, ".env"));
            fs_extra_1.default.copyFileSync(path_1.resolve(coreConfigDest, "../testnet/plugins.js"), path_1.resolve(coreConfigDest, "plugins.js"));
        });
        await this.runTasks();
    }
    generateCryptoNetwork(name, pubKeyHash, nethash, wif, token, symbol, explorer) {
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
    generateCryptoMilestones(activeDelegates, blocktime, maxTxPerBlock, maxBlockPayload, rewardHeight, rewardAmount) {
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
    generateCryptoGenesisBlock(genesisWallet, delegates, pubKeyHash, totalPremine) {
        const premineWallet = this.createWallet(pubKeyHash);
        const transactions = [
            ...this.buildDelegateTransactions(delegates),
            this.createTransferTransaction(premineWallet, genesisWallet, totalPremine),
        ];
        const genesisBlock = this.createGenesisBlock(premineWallet.keys, transactions, 0);
        return genesisBlock;
    }
    generateCoreDelegates(activeDelegates, pubKeyHash) {
        const wallets = [];
        for (let i = 0; i < activeDelegates; i++) {
            const delegateWallet = this.createWallet(pubKeyHash);
            delegateWallet.username = `genesis_${i + 1}`;
            wallets.push(delegateWallet);
        }
        return wallets;
    }
    createWallet(pubKeyHash) {
        const passphrase = bip39_1.generateMnemonic();
        const keys = crypto_1.Identities.Keys.fromPassphrase(passphrase);
        return {
            address: crypto_1.Identities.Address.fromPublicKey(keys.publicKey, pubKeyHash),
            passphrase,
            keys,
            username: undefined,
        };
    }
    buildDelegateTransactions(delegatesWallets) {
        return delegatesWallets.map(w => {
            const { data: transaction } = crypto_1.Transactions.BuilderFactory.delegateRegistration()
                .usernameAsset(w.username)
                .fee(`${25 * 10e8}`)
                .sign(w.passphrase);
            return this.formatGenesisTransaction(transaction, w);
        });
    }
    createTransferTransaction(senderWallet, receiverWallet, amount) {
        const { data: transaction } = crypto_1.Transactions.BuilderFactory.transfer()
            .recipientId(receiverWallet.address)
            .amount(amount)
            .sign(senderWallet.passphrase);
        return this.formatGenesisTransaction(transaction, senderWallet);
    }
    formatGenesisTransaction(transaction, wallet) {
        Object.assign(transaction, {
            fee: "0",
            timestamp: 0,
        });
        transaction.signature = crypto_1.Transactions.Signer.sign(transaction, wallet.keys);
        transaction.id = crypto_1.Transactions.Utils.getId(transaction);
        return transaction;
    }
    createGenesisBlock(keys, transactions, timestamp) {
        transactions = transactions.sort((a, b) => {
            if (a.type === b.type) {
                return a.amount - b.amount;
            }
            return a.type - b.type;
        });
        let payloadLength = 0;
        let totalFee = crypto_1.Utils.BigNumber.ZERO;
        let totalAmount = crypto_1.Utils.BigNumber.ZERO;
        const allBytes = [];
        for (const transaction of transactions) {
            const bytes = crypto_1.Transactions.Serializer.getBytes(transaction);
            allBytes.push(bytes);
            payloadLength += bytes.length;
            totalFee = totalFee.plus(new crypto_1.Utils.BigNumber(transaction.fee));
            totalAmount = totalAmount.plus(new crypto_1.Utils.BigNumber(transaction.amount));
        }
        const payloadHash = crypto_1.Crypto.HashAlgorithms.sha256(Buffer.concat(allBytes));
        const block = {
            version: 0,
            totalAmount: totalAmount.toString(),
            totalFee: totalFee.toString(),
            reward: "0",
            payloadHash: payloadHash.toString("hex"),
            timestamp,
            numberOfTransactions: transactions.length,
            payloadLength,
            previousBlock: null,
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
    getBlockId(block) {
        const hash = this.getHash(block);
        const blockBuffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            blockBuffer[i] = hash[7 - i];
        }
        return crypto_1.Utils.BigNumber.make(`0x${blockBuffer.toString("hex")}`).toString();
    }
    signBlock(block, keys) {
        const hash = this.getHash(block);
        return crypto_1.Crypto.Hash.signECDSA(hash, keys);
    }
    getHash(block) {
        return crypto_1.Crypto.HashAlgorithms.sha256(this.getBytes(block));
    }
    getBytes(genesisBlock) {
        const size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 32 + 64;
        const byteBuffer = new bytebuffer_1.default(size, true);
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
exports.GenerateCommand = GenerateCommand;
GenerateCommand.description = "Generates a new network configuration";
GenerateCommand.examples = [
    `Generates a new network configuration
$ ark config:generate --network=mynet7 --premine=120000000000 --delegates=47 --blocktime=9 --maxTxPerBlock=122 --maxBlockPayload=123444 --rewardHeight=23000 --rewardAmount=66000 --pubKeyHash=168 --wif=27 --token=myn --symbol=my --explorer=myex.io
`,
];
GenerateCommand.flags = {
    network: command_1.flags.string({
        description: "the name of the network that should be used",
    }),
    premine: command_1.flags.string({
        description: "the amount of token pre-mined",
        default: "12500000000000000",
    }),
    delegates: command_1.flags.integer({
        description: "the number of delegates to generate",
        default: 51,
    }),
    blocktime: command_1.flags.integer({
        description: "the network blocktime",
        default: 8,
    }),
    maxTxPerBlock: command_1.flags.integer({
        description: "the maximum number of transactions per block",
        default: 150,
    }),
    maxBlockPayload: command_1.flags.integer({
        description: "the maximum payload length by block",
        default: 2097152,
    }),
    rewardHeight: command_1.flags.integer({
        description: "the height at which the delegate block reward kicks in",
        default: 75600,
    }),
    rewardAmount: command_1.flags.integer({
        description: "the amount of the block reward",
        default: 200000000,
    }),
    pubKeyHash: command_1.flags.integer({
        description: "the public key hash",
    }),
    wif: command_1.flags.integer({
        description: "the WIF that should be used",
    }),
    token: command_1.flags.string({
        description: "the token name that should be used",
    }),
    symbol: command_1.flags.string({
        description: "the symbol that should be used",
    }),
    explorer: command_1.flags.string({
        description: "the explorer url that should be used",
    }),
};
//# sourceMappingURL=generate.js.map