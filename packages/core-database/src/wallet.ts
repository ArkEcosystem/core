import {
    Bignum,
    constants,
    crypto,
    formatSatoshi,
    IMultiSignatureAsset,
    ITransactionData,
    models,
} from "@arkecosystem/crypto";

const { TransactionTypes } = constants;

export class Wallet {
    public address: string;
    public publicKey: string | null;
    public secondPublicKey: string | null;
    public balance: Bignum;
    public vote: string;
    public voted: boolean;
    public username: string | null;
    public lastBlock: any;
    public voteBalance: Bignum;
    public multisignature?: IMultiSignatureAsset;
    public dirty: boolean;
    public producedBlocks: number;
    public missedBlocks: number;
    public forgedFees: Bignum;
    public forgedRewards: Bignum;
    public rate?: number;

    constructor(address: string) {
        this.address = address;
        this.publicKey = null;
        this.secondPublicKey = null;
        this.balance = Bignum.ZERO;
        this.vote = null;
        this.voted = false;
        this.username = null;
        this.lastBlock = null;
        this.voteBalance = Bignum.ZERO;
        this.multisignature = null;
        this.dirty = true;
        this.producedBlocks = 0;
        this.missedBlocks = 0;
        this.forgedFees = Bignum.ZERO;
        this.forgedRewards = Bignum.ZERO;
    }

    /**
     * Add block data to this wallet.
     */
    public applyBlock(block: models.IBlockData): boolean {
        this.dirty = true;

        if (
            block.generatorPublicKey === this.publicKey ||
            crypto.getAddress(block.generatorPublicKey) === this.address
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
    public revertBlock(block: models.IBlockData): boolean {
        if (
            block.generatorPublicKey === this.publicKey ||
            crypto.getAddress(block.generatorPublicKey) === this.address
        ) {
            this.dirty = true;
            this.balance = this.balance.minus(block.reward).minus(block.totalFee);

            // update stats
            this.forgedFees = this.forgedFees.minus(block.totalFee);
            this.forgedRewards = this.forgedRewards.minus(block.reward);
            this.producedBlocks--;

            // TODO: get it back from database?
            this.lastBlock = null;
            return true;
        }

        return false;
    }

    /**
     * Verify multi-signatures for the wallet.
     */
    public verifySignatures(transaction: ITransactionData, multisignature: IMultiSignatureAsset): boolean {
        if (!transaction.signatures || transaction.signatures.length < multisignature.min) {
            return false;
        }

        const keysgroup = multisignature.keysgroup.map(publicKey =>
            publicKey.startsWith("+") ? publicKey.slice(1) : publicKey,
        );
        const signatures = Object.values(transaction.signatures);

        let valid = 0;
        for (const publicKey of keysgroup) {
            const signature = this.verifyTransactionSignatures(transaction, signatures, publicKey);
            if (signature) {
                signatures.splice(signatures.indexOf(signature), 1);
                valid++;
                if (valid === multisignature.min) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Audit the specified transaction.
     */
    public auditApply(transaction: ITransactionData): any[] {
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
            audit.push({ "Signature validation": crypto.verify(transaction) });
            // TODO: this can blow up if 2nd phrase and other transactions are in the wrong order
            if (this.secondPublicKey) {
                audit.push({
                    "Second Signature Verification": crypto.verifySecondSignature(transaction, this.secondPublicKey),
                });
            }
        }

        if (transaction.type === TransactionTypes.Transfer) {
            audit.push({ Transfer: true });
        }

        if (transaction.type === TransactionTypes.SecondSignature) {
            audit.push({ "Second public key": this.secondPublicKey });
        }

        if (transaction.type === TransactionTypes.DelegateRegistration) {
            const username = transaction.asset.delegate.username;
            audit.push({ "Current username": this.username });
            audit.push({ "New username": username });
        }

        if (transaction.type === TransactionTypes.Vote) {
            audit.push({ "Current vote": this.vote });
            audit.push({ "New vote": transaction.asset.votes[0] });
        }

        if (transaction.type === TransactionTypes.MultiSignature) {
            const keysgroup = transaction.asset.multisignature.keysgroup;
            audit.push({ "Multisignature not yet registered": !this.multisignature });
            audit.push({
                "Multisignature enough keys": keysgroup.length >= transaction.asset.multisignature.min,
            });
            audit.push({
                "Multisignature all keys signed": keysgroup.length === transaction.signatures.length,
            });
            audit.push({
                "Multisignature verification": this.verifySignatures(transaction, transaction.asset.multisignature),
            });
        }

        if (transaction.type === TransactionTypes.Ipfs) {
            audit.push({ IPFS: true });
        }

        if (transaction.type === TransactionTypes.TimelockTransfer) {
            audit.push({ Timelock: true });
        }

        if (transaction.type === TransactionTypes.MultiPayment) {
            const amount = transaction.asset.payments.reduce((a, p) => a.plus(p.amount), Bignum.ZERO);
            audit.push({ "Multipayment remaining amount": amount });
        }

        if (transaction.type === TransactionTypes.DelegateResignation) {
            audit.push({ "Resignate Delegate": this.username });
        }

        if (!Object.values(TransactionTypes).includes(transaction.type)) {
            audit.push({ "Unknown Type": true });
        }

        return audit;
    }

    /**
     * Get formatted wallet address and balance as string.
     */
    public toString(): string {
        return `${this.address} (${formatSatoshi(this.balance)})`;
    }

    /**
     * Goes through signatures to check if public key matches. Can also remove valid signatures.
     */
    private verifyTransactionSignatures(
        transaction: ITransactionData,
        signatures: string[],
        publicKey: string,
    ): string | null {
        for (const signature of signatures) {
            if (this.verify(transaction, signature, publicKey)) {
                return signature;
            }
        }

        return null;
    }

    /**
     * Verify the wallet.
     */
    private verify(transaction: ITransactionData, signature: string, publicKey: string): boolean {
        const hash = crypto.getHash(transaction, { excludeSignature: true, excludeSecondSignature: true });
        return crypto.verifyHash(hash, signature, publicKey);
    }
}
