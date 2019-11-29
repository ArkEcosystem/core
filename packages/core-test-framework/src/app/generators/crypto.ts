import { Crypto, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { ensureDirSync, existsSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import { dirSync } from "tmp";

import { CryptoConfigPaths, Wallet } from "../contracts";
import { Generator } from "./generator";

export class CryptoGenerator extends Generator {
    public generate(): CryptoConfigPaths {
        const cryptoConfigDest: string = resolve(__dirname, `${dirSync().name}/${this.options.crypto.network}`);

        if (existsSync(cryptoConfigDest)) {
            throw new Error(`${cryptoConfigDest} already exists.`);
        }

        ensureDirSync(cryptoConfigDest);

        const delegates: any[] = this.generateCoreDelegates(
            this.options.crypto.delegates,
            this.options.crypto.pubKeyHash,
        );

        const genesisBlock = this.generateGenesisBlock(
            this.createWallet(this.options.crypto.pubKeyHash),
            delegates,
            this.options.crypto.pubKeyHash,
            this.options.crypto.premine,
            this.options.crypto.distribute,
        );

        writeJSONSync(
            resolve(cryptoConfigDest, "network.json"),
            this.generateNetwork(
                this.options.crypto.network,
                this.options.crypto.pubKeyHash,
                genesisBlock.payloadHash,
                this.options.crypto.wif,
                this.options.crypto.token,
                this.options.crypto.symbol,
                this.options.crypto.explorer,
            ),
            { spaces: 4 },
        );

        writeJSONSync(
            resolve(cryptoConfigDest, "milestones.json"),
            this.generateMilestones(
                this.options.crypto.delegates,
                this.options.crypto.blocktime,
                this.options.crypto.maxTxPerBlock,
                this.options.crypto.maxBlockPayload,
                this.options.crypto.rewardHeight,
                this.options.crypto.rewardAmount,
            ),
            { spaces: 4 },
        );

        writeJSONSync(resolve(cryptoConfigDest, "genesisBlock.json"), genesisBlock, { spaces: 4 });

        writeJSONSync(resolve(cryptoConfigDest, "exceptions.json"), {});

        return {
            root: cryptoConfigDest,
            exceptions: resolve(cryptoConfigDest, "exceptions.json"),
            genesisBlock: resolve(cryptoConfigDest, "genesisBlock.json"),
            milestones: resolve(cryptoConfigDest, "milestones.json"),
            network: resolve(cryptoConfigDest, "network.json"),
        };
    }

    private generateNetwork(
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

    private generateMilestones(
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

    private generateGenesisBlock(
        genesisWallet,
        delegates,
        pubKeyHash: number,
        totalPremine: string,
        distribute: boolean,
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

        if (genesisBlock.blockSignature) {
            for (const blockSignatureByte of Buffer.from(genesisBlock.blockSignature, "hex")) {
                byteBuffer.writeByte(blockSignatureByte);
            }
        }

        byteBuffer.flip();

        return byteBuffer.toBuffer();
    }
}
