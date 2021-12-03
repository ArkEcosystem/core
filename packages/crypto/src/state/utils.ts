import { Hash, HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IDelegate, IRound, ISchnorrMultiSignature, IVotingTarget } from "../interfaces";
import { configManager } from "../managers";
import { SerdeFactory } from "../serde";

export class Utils {
    public static getRoundShuffledForgers(round: IRound, delegates: readonly IDelegate[]): string[] {
        if (delegates.length !== round.length) {
            throw new CryptoError("Invalid number of delegates.");
        }

        const forgers = delegates.map((d) => d.publicKey);
        let seed = HashAlgorithms.sha256(round.no.toString());

        for (let i = 0; i < forgers.length; i++) {
            for (const s of seed.slice(0, Math.min(forgers.length - i, 4))) {
                const index = s % forgers.length;
                const t = forgers[index];
                forgers[index] = forgers[i];
                forgers[i] = t;
                i++;
            }

            seed = HashAlgorithms.sha256(seed);
        }

        return forgers;
    }

    public static getVotingTargetSignedHash(votingTarget: IVotingTarget): Buffer {
        const writer = SerdeFactory.createWriter(Buffer.alloc(4 + 32 + 4 + 32));

        writer.writeUInt32LE(votingTarget.sourceHeight);
        const sourceMilestone = configManager.getMilestone(votingTarget.sourceHeight);
        sourceMilestone.block.idFullSha256
            ? writer.writeBuffer(Buffer.from(votingTarget.sourceBlockId, "hex"))
            : writer.writeBigUInt64BE(BigInt(votingTarget.sourceBlockId));

        writer.writeUInt32LE(votingTarget.targetHeight);
        const targetMilestone = configManager.getMilestone(votingTarget.targetHeight);
        targetMilestone.block.idFullSha256
            ? writer.writeBuffer(Buffer.from(votingTarget.targetBlockId, "hex"))
            : writer.writeBigUInt64BE(BigInt(votingTarget.targetBlockId));

        return HashAlgorithms.sha256(writer.getResult());
    }

    public static getVotedValidators(
        votingTarget: IVotingTarget,
        validators: readonly string[],
        votes: readonly ISchnorrMultiSignature[],
    ): string[] {
        const signedHash = Utils.getVotingTargetSignedHash(votingTarget);
        const votedValidators: string[] = [];

        for (const { index, signature } of votes) {
            const validator = validators[index];

            if (!validator) {
                throw new CryptoError("Invalid validator public key.");
            }

            if (votedValidators.includes(validator)) {
                throw new CryptoError("Double vote.");
            }

            if (Hash.verifySchnorr(signedHash, signature, validator) === false) {
                throw new CryptoError("Invalid validation.");
            }

            votedValidators.push(validator);
        }

        return votedValidators;
    }
}
