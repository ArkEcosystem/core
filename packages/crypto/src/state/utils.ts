import { Serializer as BlockSerializer } from "../blocks";
import { Hash, HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IBlockHeader, IDelegate, IRound, ISchnorrMultiSignature, ISlot, IVoteContent } from "../interfaces";
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

    public static getVoteContentHash(voteContent: IVoteContent): Buffer {
        const writer = SerdeFactory.createWriter(Buffer.alloc(4 + 32 + 4 + 32));

        writer.writeUInt32LE(voteContent.justifiedHeight);
        BlockSerializer.writeId(writer, voteContent.justifiedHeight, voteContent.justifiedBlockId);

        writer.writeUInt32LE(voteContent.lastHeight);
        BlockSerializer.writeId(writer, voteContent.lastHeight, voteContent.lastBlockId);

        return HashAlgorithms.sha256(writer.getResult());
    }

    public static getVotedValidators(
        voteRange: IVoteContent,
        validators: readonly string[],
        votes: readonly ISchnorrMultiSignature[],
    ): string[] {
        const hash = Utils.getVoteContentHash(voteRange);
        const votedValidators: string[] = [];

        for (const { index, signature } of votes) {
            const validator = validators[index];

            if (!validator) {
                throw new CryptoError("Invalid validator public key.");
            }

            if (votedValidators.includes(validator)) {
                throw new CryptoError("Double vote.");
            }

            if (Hash.verifySchnorr(hash, signature, validator) === false) {
                throw new CryptoError("Invalid signature.");
            }

            votedValidators.push(validator);
        }

        return votedValidators;
    }

    public static getBlocktimeHeights(): number[] {
        const heights: number[] = [];
        const milestones = configManager.getMilestones();
        let blocktime = milestones[0].blocktime;

        for (const milestone of milestones.slice(1)) {
            if (milestone.blocktime !== blocktime) {
                heights.push(milestone.height);
                blocktime = milestone.blocktime;
            }
        }

        return heights;
    }

    public static getSlot(blocktimeBlocks: readonly IBlockHeader[], lastBlock: IBlockHeader): ISlot {
        const milestones = configManager.getMilestones();
        const genesisMilestone = milestones[0];
        const otherMilestones = milestones.slice(1);
        const slot = { no: 0, timestamp: 0, duration: genesisMilestone.blocktime };

        for (const block of [...blocktimeBlocks, lastBlock]) {
            while (otherMilestones[0]?.height < block.height) {
                if (otherMilestones.shift().blocktime !== slot.duration) {
                    throw new CryptoError(`Missing required bootstrap block.`);
                }
            }

            const timestampDelta = block.timestamp - slot.timestamp;
            const slotNoChange = Math.floor(timestampDelta / slot.duration);
            const slotTimestampChange = slotNoChange * slot.duration;

            slot.no += slotNoChange;
            slot.timestamp += slotTimestampChange;

            if (otherMilestones[0]?.height === block.height) {
                slot.duration = otherMilestones[0].blocktime;
            }
        }

        return slot;
    }

    public static getRound(height: number): IRound {
        const milestones = configManager.getMilestones();
        const genesisMilestone = milestones[0];
        const otherMilestones = milestones.slice(1);
        const round = { no: 1, height: 1, length: genesisMilestone.activeDelegates };

        for (const otherMilestone of otherMilestones) {
            if (otherMilestone.height > height) break;
            if (otherMilestone.activeDelegates === round.length) continue;

            const heightDelta = otherMilestone.height - round.height;
            const roundNoChange = Math.floor(heightDelta / round.length);
            const roundHeightChange = roundNoChange * round.length;

            if (roundHeightChange !== heightDelta) {
                throw new Error();
            }

            round.no += roundNoChange;
            round.height += roundHeightChange;
            round.length = otherMilestone.activeDelegates;
        }

        const heightDelta = height - round.height;
        const roundNoChange = Math.floor(heightDelta / round.length);
        const roundHeightChange = roundNoChange * round.length;

        round.no += roundNoChange;
        round.height += roundHeightChange;

        return round;
    }
}
