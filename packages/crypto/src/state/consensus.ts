import { Hash, HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IState } from "../interfaces";

export class Consensus {
    public static getAllDelegatePublicKeys(state: IState): string[] {
        if (!state.nextDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        const allDelegatePublicKeys = state.finalizedDelegates.slice();

        for (const lastDelegate of state.lastDelegates) {
            if (allDelegatePublicKeys.includes(lastDelegate) === false) {
                allDelegatePublicKeys.push(lastDelegate);
            }
        }

        for (const nextDelegate of state.nextDelegates) {
            if (allDelegatePublicKeys.includes(nextDelegate) === false) {
                allDelegatePublicKeys.push(nextDelegate);
            }
        }

        return allDelegatePublicKeys;
    }

    public static getVoteSignedHash(state: IState): Buffer {
        let size = 0;
        size += 4; // justifiedBlock.height
        size += 4; // lastBlock.height
        size += state.justifiedBlock.id.length === 64 ? 32 : 8; // justifiedBlock.id
        size += state.lastBlock.id.length === 64 ? 32 : 8; // lastBlock.id

        const buffer = Buffer.alloc(size);

        let offset = 0;
        offset = buffer.writeUInt32LE(state.justifiedBlock.height, offset);
        offset = buffer.writeUInt32LE(state.lastBlock.height, offset);

        if (state.justifiedBlock.id.length === 64) {
            const id = Buffer.from(state.justifiedBlock.id, "hex");
            offset += id.copy(buffer, offset);
        } else {
            const id = BigInt(state.justifiedBlock.id);
            offset = buffer.writeBigUInt64BE(id, offset);
        }

        if (state.lastBlock.id.length === 64) {
            const id = Buffer.from(state.lastBlock.id, "hex");
            offset += id.copy(buffer, offset);
        } else {
            const id = BigInt(state.lastBlock.id);
            offset = buffer.writeBigUInt64BE(id, offset);
        }

        return HashAlgorithms.sha256(buffer);
    }

    public static canVote(state: IState, delegatePublicKey: string): boolean {
        return this.getAllDelegatePublicKeys(state).includes(delegatePublicKey);
    }

    public static isVoteNecessary(state: IState): boolean {
        if (!state.nextDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        if (state.forgedTransactionCount !== state.finalizedTransactionCount) {
            return true;
        }

        for (const finalizedDelegate of state.finalizedDelegates) {
            if (state.lastDelegates.includes(finalizedDelegate) === false) return true;
            if (state.nextDelegates.includes(finalizedDelegate) === false) return true;
        }

        for (const lastDelegate of state.lastDelegates) {
            if (state.finalizedDelegates.includes(lastDelegate) === false) return true;
            if (state.nextDelegates.includes(lastDelegate) === false) return true;
        }

        for (const nextDelegate of state.nextDelegates) {
            if (state.finalizedDelegates.includes(nextDelegate) === false) return true;
            if (state.lastDelegates.includes(nextDelegate) === false) return true;
        }

        return false;
    }

    public static isValidVote(state: IState, previousBlockVote: string): boolean {
        const voteSignedHash = this.getVoteSignedHash(state);
        const allDelegatePublicKeys = this.getAllDelegatePublicKeys(state);
        const publicKeyIndex = parseInt(previousBlockVote.slice(0, 2), 16);
        const signature = previousBlockVote.slice(2);
        const publicKey = allDelegatePublicKeys[publicKeyIndex];

        if (!publicKey) {
            return false;
        }

        return Hash.verifySchnorr(voteSignedHash, signature, publicKey);
    }

    public static hasSupermajorityVote(state: IState, previousBlockVotes: readonly string[]): boolean {
        if (!state.nextDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        const voteSignedHash = this.getVoteSignedHash(state);
        const allDelegatePublicKeys = this.getAllDelegatePublicKeys(state);
        const verifiedKeys = new Set<string>();

        for (const previousBlockVote of previousBlockVotes) {
            const publicKeyIndex = parseInt(previousBlockVote.slice(0, 2), 16);
            const signature = previousBlockVote.slice(2);
            const publicKey = allDelegatePublicKeys[publicKeyIndex];

            if (!publicKey) {
                throw new CryptoError("Invalid public key index.");
            }

            if (!Hash.verifySchnorr(voteSignedHash, signature, publicKey)) {
                throw new CryptoError("Invalid signature.");
            }

            verifiedKeys.add(publicKey);
        }

        for (const delegates of [state.finalizedDelegates, state.lastDelegates, state.nextDelegates]) {
            const voteCount = delegates.filter((key) => verifiedKeys.has(key)).length;
            const threshold = (delegates.length * 2) / 3;

            if (voteCount < threshold) {
                return false;
            }
        }

        return true;
    }
}
