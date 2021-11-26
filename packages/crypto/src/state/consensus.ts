import { Hash, HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { ISchnorrMultiSignature, IState } from "../interfaces";

export class Consensus {
    public static getVotingDelegates(state: IState): string[] {
        if (!state.nextBlockRoundDelegates) {
            throw new CryptoError("Next block round delegates aren't set.");
        }

        const delegates = state.finalizedDelegates.slice();

        for (const lastDelegate of state.lastRoundDelegates) {
            if (delegates.includes(lastDelegate) === false) {
                delegates.push(lastDelegate);
            }
        }

        for (const nextDelegate of state.nextBlockRoundDelegates) {
            if (delegates.includes(nextDelegate) === false) {
                delegates.push(nextDelegate);
            }
        }

        return delegates;
    }

    public static getVoteSignedHash(state: IState): Buffer {
        const justifiedIdSize = state.justifiedBlock.id.length === 64 ? 32 : 8;
        const lastIdSize = state.lastBlock.id.length === 64 ? 32 : 8;
        const size = 4 + justifiedIdSize + 4 + lastIdSize;

        let offset = 0;
        const buffer = Buffer.alloc(size);

        for (const block of [state.justifiedBlock, state.lastBlock]) {
            offset = buffer.writeUInt32LE(block.height, offset);

            if (block.id.length === 64) {
                offset += Buffer.from(block.id, "hex").copy(buffer, offset);
            } else {
                offset = buffer.writeBigUInt64BE(BigInt(block.id), offset);
            }
        }

        return HashAlgorithms.sha256(buffer);
    }

    public static canVote(state: IState, delegatePublicKey: string): boolean {
        return this.getVotingDelegates(state).includes(delegatePublicKey);
    }

    public static isVoteNecessary(state: IState): boolean {
        if (!state.nextBlockRoundDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        if (state.forgedTransactionCount !== state.finalizedTransactionCount) {
            return true;
        }

        for (const finalizedDelegate of state.finalizedDelegates) {
            if (state.lastRoundDelegates.includes(finalizedDelegate) === false) return true;
            if (state.nextBlockRoundDelegates.includes(finalizedDelegate) === false) return true;
        }

        for (const lastDelegate of state.lastRoundDelegates) {
            if (state.finalizedDelegates.includes(lastDelegate) === false) return true;
            if (state.nextBlockRoundDelegates.includes(lastDelegate) === false) return true;
        }

        for (const nextDelegate of state.nextBlockRoundDelegates) {
            if (state.finalizedDelegates.includes(nextDelegate) === false) return true;
            if (state.lastRoundDelegates.includes(nextDelegate) === false) return true;
        }

        return false;
    }

    public static isValidVote(state: IState, previousBlockVote: ISchnorrMultiSignature): boolean {
        const delegates = this.getVotingDelegates(state);
        const publicKey = delegates[previousBlockVote.index];

        if (!publicKey) {
            return false;
        }

        return Hash.verifySchnorr(this.getVoteSignedHash(state), previousBlockVote.signature, publicKey);
    }

    public static hasSupermajorityVote(state: IState, previousBlockVotes: readonly ISchnorrMultiSignature[]): boolean {
        if (!state.nextBlockRoundDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        const hash = this.getVoteSignedHash(state);
        const delegates = this.getVotingDelegates(state);
        const verifiedKeys = new Set<string>();

        for (const { index, signature } of previousBlockVotes) {
            const publicKey = delegates[index];

            if (!publicKey) {
                throw new CryptoError("Invalid public key index.");
            }

            if (!Hash.verifySchnorr(hash, signature, publicKey)) {
                throw new CryptoError("Invalid signature.");
            }

            verifiedKeys.add(publicKey);
        }

        for (const delegates of [state.finalizedDelegates, state.lastRoundDelegates, state.nextBlockRoundDelegates]) {
            const voteCount = delegates.filter((key) => verifiedKeys.has(key)).length;
            const threshold = (delegates.length * 2) / 3;

            if (voteCount < threshold) {
                return false;
            }
        }

        return true;
    }
}
