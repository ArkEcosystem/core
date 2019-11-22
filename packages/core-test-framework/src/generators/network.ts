import { Crypto, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import ByteBuffer from "bytebuffer";
import { copyFileSync, ensureDirSync, existsSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import { dirSync } from "tmp";

import { ConfigPaths } from "../app/types";
import secrets from "../internal/secrets.json";

interface Wallet {
    address: string;
    passphrase: string;
    keys: Interfaces.IKeyPair;
    username: string | undefined;
}

// todo: copy the config into a temp dir
// todo: remove the config after tests finish
export class GenerateNetwork {
    private defaults: Record<string, any> = {
        network: "unitnet",
        premine: "15300000000000000",
        delegates: 51,
        blocktime: 8,
        maxTxPerBlock: 150,
        maxBlockPayload: 2097152,
        rewardHeight: 75600,
        rewardAmount: 200000000,
        pubKeyHash: 23,
        wif: 186,
        token: "UARK",
        symbol: "UѦ",
        explorer: "http://uexplorer.ark.io",
        distribute: true,
    };

    public generate(opts: Record<string, any>): ConfigPaths {
        opts = { ...this.defaults, ...opts };

        const coreConfigDest: string = resolve(__dirname, `${dirSync().name}/${opts.network}`);
        const cryptoConfigDest: string = resolve(__dirname, `${dirSync().name}/${opts.network}`);

        if (existsSync(coreConfigDest)) {
            throw new Error(`${coreConfigDest} already exists.`);
        }

        if (existsSync(cryptoConfigDest)) {
            throw new Error(`${cryptoConfigDest} already exists.`);
        }

        ensureDirSync(coreConfigDest);
        ensureDirSync(cryptoConfigDest);

        const delegates: any[] = this.generateCoreDelegates(opts.delegates, opts.pubKeyHash);

        const genesisBlock = this.generateCryptoGenesisBlock(
            this.createWallet(opts.pubKeyHash),
            delegates,
            opts.pubKeyHash,
            opts.premine,
            opts.distribute,
        );

        writeJSONSync(
            resolve(cryptoConfigDest, "network.json"),
            this.generateCryptoNetwork(
                opts.network,
                opts.pubKeyHash,
                genesisBlock.payloadHash,
                opts.wif,
                opts.token,
                opts.symbol,
                opts.explorer,
            ),
            { spaces: 4 },
        );

        writeJSONSync(
            resolve(cryptoConfigDest, "milestones.json"),
            this.generateCryptoMilestones(
                opts.delegates,
                opts.blocktime,
                opts.maxTxPerBlock,
                opts.maxBlockPayload,
                opts.rewardHeight,
                opts.rewardAmount,
            ),
            { spaces: 4 },
        );

        writeJSONSync(resolve(cryptoConfigDest, "genesisBlock.json"), genesisBlock, { spaces: 4 });

        writeJSONSync(resolve(cryptoConfigDest, "exceptions.json"), {});

        writeJSONSync(resolve(coreConfigDest, "peers.json"), { list: [] }, { spaces: 4 });

        writeJSONSync(
            resolve(coreConfigDest, "delegates.json"),
            { secrets: delegates.map(d => d.passphrase) },
            { spaces: 4 },
        );

        // include this file in the package so it works once published on npm
        copyFileSync(resolve(__dirname, "../../../core/bin/config/testnet/.env"), resolve(coreConfigDest, ".env"));

        // include this file in the package so it works once published on npm
        copyFileSync(
            resolve(__dirname, "../../../core/bin/config/testnet/app.json"),
            resolve(coreConfigDest, "app.json"),
        );

        return {
            core: {
                root: coreConfigDest,
                env: resolve(coreConfigDest, ".env"),
                app: resolve(coreConfigDest, "app.js"),
                delegates: resolve(coreConfigDest, "delegates.json"),
                peers: resolve(coreConfigDest, "peers.json"),
            },
            crypto: {
                root: cryptoConfigDest,
                exceptions: resolve(cryptoConfigDest, "exceptions.json"),
                genesisBlock: resolve(cryptoConfigDest, "genesisBlock.json"),
                milestones: resolve(cryptoConfigDest, "milestones.json"),
                network: resolve(cryptoConfigDest, "network.json"),
            },
        };
    }

    public generateCore(opts: Record<string, any> = {}) {
        opts = { ...this.defaults, ...opts };

        const coreConfigDest: string = resolve(__dirname, `${dirSync().name}/${opts.network}`);

        if (existsSync(coreConfigDest)) {
            throw new Error(`${coreConfigDest} already exists.`);
        }

        const delegates: any[] = this.generateCoreDelegates(opts.delegates, opts.pubKeyHash);

        ensureDirSync(coreConfigDest);

        // write
        writeJSONSync(resolve(coreConfigDest, "peers.json"), { list: [] }, { spaces: 4 });

        writeJSONSync(
            resolve(coreConfigDest, "delegates.json"),
            { secrets: delegates.map(d => d.passphrase) },
            { spaces: 4 },
        );

        // include this file in the package so it works once published on npm
        copyFileSync(resolve(__dirname, "../../../core/bin/config/testnet/.env"), resolve(coreConfigDest, ".env"));

        // include this file in the package so it works once published on npm
        copyFileSync(
            resolve(__dirname, "../../../core/bin/config/testnet/app.json"),
            resolve(coreConfigDest, "app.json"),
        );

        return {
            root: coreConfigDest,
            env: resolve(coreConfigDest, ".env"),
            app: resolve(coreConfigDest, "app.js"),
            delegates: resolve(coreConfigDest, "delegates.json"),
            peers: resolve(coreConfigDest, "peers.json"),
        };
    }

    public generateCrypto(opts?: Record<string, any>) {
        opts = { ...this.defaults, ...opts };

        const genesisBlock = this.generateCryptoGenesisBlock(
            this.createWallet(opts.pubKeyHash),
            this.generateCoreDelegates(opts.delegates, opts.pubKeyHash),
            opts.pubKeyHash,
            opts.premine,
            opts.distribute,
        );

        return {
            exceptions: {},
            genesisBlock,
            milestones: this.generateCryptoMilestones(
                opts.delegates,
                opts.blocktime,
                opts.maxTxPerBlock,
                opts.maxBlockPayload,
                opts.rewardHeight,
                opts.rewardAmount,
            ),
            network: this.generateCryptoNetwork(
                opts.network,
                opts.pubKeyHash,
                genesisBlock.payloadHash,
                opts.wif,
                opts.token,
                opts.symbol,
                opts.explorer,
            ),
        };
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
            const delegateWallet: Wallet = this.createWallet(pubKeyHash, secrets[i]);
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
