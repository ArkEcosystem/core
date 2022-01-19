import { Types } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { ensureDirSync, existsSync, writeJSONSync } from "fs-extra";
import { resolve } from "path";
import { dirSync } from "tmp";

import { CryptoConfigPaths, Wallet } from "../contracts";
import { Generator } from "./generator";

export class CryptoGenerator extends Generator {
    /**
     * @private
     * @type {string}
     * @memberof CoreGenerator
     */
    private destination!: string;

    /**
     * @returns {CoreConfigPaths}
     * @memberof CoreGenerator
     */
    public generate(): CryptoConfigPaths {
        this.destination = resolve(__dirname, `${dirSync().name}/${this.options.crypto.flags.network}`);

        if (existsSync(this.destination)) {
            throw new Error(`${this.destination} already exists.`);
        }

        ensureDirSync(this.destination);

        const genesisBlock =
            this.options.crypto.genesisBlock ??
            this.generateGenesisBlock(
                this.createWallet(this.options.crypto.flags.pubKeyHash),
                this.generateCoreDelegates(this.options.crypto.flags.delegates, this.options.crypto.flags.pubKeyHash),
                this.options.crypto.flags.pubKeyHash,
                this.options.crypto.flags.premine,
                this.options.crypto.flags.distribute,
            );

        this.writeExceptions();

        this.writeGenesisBlock(genesisBlock);

        this.writeMilestones(genesisBlock);

        this.writeNetwork(genesisBlock.payloadHash);

        return {
            root: this.destination,
            exceptions: resolve(this.destination, "exceptions.json"),
            genesisBlock: resolve(this.destination, "genesisBlock.json"),
            milestones: resolve(this.destination, "milestones.json"),
            network: resolve(this.destination, "network.json"),
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
                aip37: true,
                htlcEnabled: true,
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
            fee: Utils.BigNumber.make("0"),
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

        // Unreachable
        // if (genesisBlock.blockSignature) {
        //     for (const blockSignatureByte of Buffer.from(genesisBlock.blockSignature, "hex")) {
        //         byteBuffer.writeByte(blockSignatureByte);
        //     }
        // }

        byteBuffer.flip();

        return byteBuffer.toBuffer();
    }

    /**
     * @private
     * @memberof CryptoGenerator
     */
    private writeExceptions(): void {
        const filePath: string = resolve(this.destination, "exceptions.json");

        if (this.options.crypto.exceptions) {
            writeJSONSync(filePath, this.options.crypto.exceptions, { spaces: 4 });
        } else {
            writeJSONSync(resolve(this.destination, "exceptions.json"), {});
        }
    }

    /**
     * @private
     * @param {Types.JsonObject} genesisBlock
     * @memberof CryptoGenerator
     */
    private writeGenesisBlock(genesisBlock: Types.JsonObject): void {
        const filePath: string = resolve(this.destination, "genesisBlock.json");

        if (this.options.crypto.genesisBlock) {
            writeJSONSync(filePath, this.options.crypto.genesisBlock, { spaces: 4 });
        } else {
            writeJSONSync(filePath, genesisBlock, { spaces: 4 });
        }
    }

    /**
     * @private
     * @param {Types.JsonObject} genesisBlock
     * @memberof CryptoGenerator
     */
    private writeMilestones(genesisBlock: Types.JsonObject): void {
        const filePath: string = resolve(this.destination, "milestones.json");

        if (this.options.crypto.milestones) {
            writeJSONSync(filePath, this.options.crypto.milestones, { spaces: 4 });
        } else {
            writeJSONSync(
                resolve(this.destination, "milestones.json"),
                this.generateMilestones(
                    this.options.crypto.flags.delegates,
                    this.options.crypto.flags.blocktime,
                    this.options.crypto.flags.maxTxPerBlock,
                    this.options.crypto.flags.maxBlockPayload,
                    this.options.crypto.flags.rewardHeight,
                    this.options.crypto.flags.rewardAmount,
                ),
                { spaces: 4 },
            );
        }
    }

    /**
     * @private
     * @param {string} payloadHash
     * @memberof CryptoGenerator
     */
    private writeNetwork(payloadHash: string): void {
        const filePath: string = resolve(this.destination, "network.json");

        if (this.options.crypto.network) {
            writeJSONSync(filePath, this.options.crypto.network, { spaces: 4 });
        } else {
            writeJSONSync(
                filePath,
                this.generateNetwork(
                    this.options.crypto.flags.network,
                    this.options.crypto.flags.pubKeyHash,
                    payloadHash,
                    this.options.crypto.flags.wif,
                    this.options.crypto.flags.token,
                    this.options.crypto.flags.symbol,
                    this.options.crypto.flags.explorer,
                ),
                { spaces: 4 },
            );
        }
    }
}
