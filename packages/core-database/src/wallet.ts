import { Database } from "@arkecosystem/core-interfaces";
import { Crypto, Enums, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

export class Wallet implements Database.IWallet {
    public address: string;
    public publicKey: string | null;
    public secondPublicKey: string | null;
    public balance: Utils.BigNumber;
    public vote: string;
    public voted: boolean;
    public username: string | null;
    public lastBlock: any;
    public voteBalance: Utils.BigNumber;
    public multisignature?: Interfaces.IMultiSignatureAsset;
    public dirty: boolean;
    public producedBlocks: number;
    public forgedFees: Utils.BigNumber;
    public forgedRewards: Utils.BigNumber;
    public rate?: number;

    constructor(address: string) {
        this.address = address;
        this.publicKey = null;
        this.secondPublicKey = null;
        this.balance = Utils.BigNumber.ZERO;
        this.vote = null;
        this.voted = false;
        this.username = null;
        this.lastBlock = null;
        this.voteBalance = Utils.BigNumber.ZERO;
        this.multisignature = null;
        this.producedBlocks = 0;
        this.forgedFees = Utils.BigNumber.ZERO;
        this.forgedRewards = Utils.BigNumber.ZERO;
    }

    /**
     * Add block data to this wallet.
     */
    public applyBlock(block: Interfaces.IBlockData): boolean {
        if (
            block.generatorPublicKey === this.publicKey ||
            Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address
        ) {
            this.balance = this.balance.plus(block.reward).plus(block.totalFee);

            // update stats
            this.producedBlocks++;
            this.forgedFees = this.forgedFees.plus(block.totalFee);
            this.forgedRewards = this.forgedRewards.plus(block.reward);
            this.lastBlock = block;
            return true;
        }

        return false;
    }

    /**
     * Remove block data from this wallet.
     */
    public revertBlock(block: Interfaces.IBlockData): boolean {
        if (
            block.generatorPublicKey === this.publicKey ||
            Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address
        ) {
            this.balance = this.balance.minus(block.reward).minus(block.totalFee);

            this.forgedFees = this.forgedFees.minus(block.totalFee);
            this.forgedRewards = this.forgedRewards.minus(block.reward);
            this.producedBlocks--;

            // TODO: get it back from database?
            this.lastBlock = null;
            return true;
        }

        return false;
    }

    public verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignature: Interfaces.IMultiSignatureAsset,
    ): boolean {
        const { publicKeys, min } = multiSignature;
        const { signatures } = transaction;

        const hash = Transactions.Transaction.getHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
        });

        let verified = false;
        let verifiedSignatures = 0;
        for (let i = 0; i < signatures.length; i++) {
            const signature = signatures[i];
            const publicKeyIndex = parseInt(signature.slice(0, 2), 16);
            const partialSignature = signature.slice(2, 130);
            const publicKey = publicKeys[publicKeyIndex];

            if (Crypto.Hash.verifySchnorr(hash, partialSignature, publicKey)) {
                verifiedSignatures++;
            }

            if (verifiedSignatures === min) {
                verified = true;
                break;
            } else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
                break;
            }
        }

        return verified;
    }

    /**
     * Audit the specified transaction.
     */
    public auditApply(transaction: Interfaces.ITransactionData): any[] {
        const audit = [];

        if (this.multisignature) {
            audit.push({
                Mutisignature: this.verifySignatures(transaction, this.multisignature),
            });
        } else {
            audit.push({
                "Remaining amount": +this.balance
                    .minus(transaction.amount)
                    .minus(transaction.fee)
                    .toFixed(),
            });
            audit.push({ "Signature validation": Transactions.Transaction.verifyData(transaction) });
            // TODO: this can blow up if 2nd phrase and other transactions are in the wrong order
            if (this.secondPublicKey) {
                audit.push({
                    "Second Signature Verification": Transactions.Transaction.verifySecondSignature(
                        transaction,
                        this.secondPublicKey,
                    ),
                });
            }
        }

        if (transaction.type === Enums.TransactionTypes.Transfer) {
            audit.push({ Transfer: true });
        }

        if (transaction.type === Enums.TransactionTypes.SecondSignature) {
            audit.push({ "Second public key": this.secondPublicKey });
        }

        if (transaction.type === Enums.TransactionTypes.DelegateRegistration) {
            const username = transaction.asset.delegate.username;
            audit.push({ "Current username": this.username });
            audit.push({ "New username": username });
        }

        if (transaction.type === Enums.TransactionTypes.Vote) {
            audit.push({ "Current vote": this.vote });
            audit.push({ "New vote": transaction.asset.votes[0] });
        }

        if (transaction.type === Enums.TransactionTypes.MultiSignature) {
            const keysgroup = transaction.asset.multisignature.keysgroup;
            audit.push({ "Multisignature not yet registered": !this.multisignature });
            audit.push({
                "Multisignature enough keys": keysgroup.length >= transaction.asset.multiSignature.min,
            });
            audit.push({
                "Multisignature all keys signed": keysgroup.length === transaction.signatures.length,
            });
            audit.push({
                "Multisignature verification": this.verifySignatures(transaction, transaction.asset.multiSignature),
            });
        }

        if (transaction.type === Enums.TransactionTypes.Ipfs) {
            audit.push({ IPFS: true });
        }

        if (transaction.type === Enums.TransactionTypes.TimelockTransfer) {
            audit.push({ Timelock: true });
        }

        if (transaction.type === Enums.TransactionTypes.MultiPayment) {
            const amount = transaction.asset.payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);
            audit.push({ "Multipayment remaining amount": amount });
        }

        if (transaction.type === Enums.TransactionTypes.DelegateResignation) {
            audit.push({ "Resignate Delegate": this.username });
        }

        if (!Object.values(Enums.TransactionTypes).includes(transaction.type)) {
            audit.push({ "Unknown Type": true });
        }

        return audit;
    }

    /**
     * Get formatted wallet address and balance as string.
     */
    public toString(): string {
        return `${this.address} (${Utils.formatSatoshi(this.balance)})`;
    }
}
