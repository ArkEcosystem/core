import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { AlreadyVotedError, NoVoteError, UnvoteMismatchError } from "../../errors";
import { Wallet } from "../../models";
import { AbstractTransaction } from "./abstract";

export class VoteTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.Vote;

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(24, true);

        const voteBytes = data.asset.votes.map(vote => (vote[0] === "+" ? "01" : "00") + vote.slice(1)).join("");
        buffer.writeByte(data.asset.votes.length);
        buffer.append(voteBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const votelength = buf.readUint8();
        data.asset = { votes: [] };

        for (let i = 0; i < votelength; i++) {
            let vote = buf.readBytes(34).toString("hex");
            vote = (vote[1] === "1" ? "+" : "-") + vote.slice(2);
            data.asset.votes.push(vote);
        }
    }

    public canBeApplied(wallet: Wallet): boolean {
        const { data } = this;

        const vote = data.asset.votes[0];
        if (vote.startsWith("+")) {
            if (wallet.vote) {
                throw new AlreadyVotedError();
            }
        } else {
            if (!wallet.vote) {
                throw new NoVoteError();
            } else if (wallet.vote !== vote.slice(1)) {
                throw new UnvoteMismatchError();
            }
        }

        return super.canBeApplied(wallet);
    }

    protected apply(wallet: Wallet): void {
        const vote = this.data.asset.votes[0];
        if (vote.startsWith("+")) {
            wallet.vote = vote.slice(1);
        } else {
            wallet.vote = null;
        }
    }

    protected revert(wallet: Wallet): void {
        const vote = this.data.asset.votes[0];
        if (vote.startsWith("+")) {
            wallet.vote = null;
        } else {
            wallet.vote = vote.slice(1);
        }
    }
}
