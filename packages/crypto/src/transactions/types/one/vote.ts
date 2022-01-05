import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export class VoteTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Vote;
    public static key = "vote";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("100000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.vote;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(100));

        if (data.asset && data.asset.votes) {
            const voteBytes = data.asset.votes
                .map((vote) => (vote.startsWith("+") ? "01" : "00") + vote.slice(1))
                .join("");
            buff.writeUInt8(data.asset.votes.length);
            buff.writeBuffer(Buffer.from(voteBytes, "hex"));
        }

        return buff;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const votelength: number = buf.readUInt8();
        data.asset = { votes: [] };

        for (let i = 0; i < votelength; i++) {
            let vote: string = buf.readBuffer(34).toString("hex");
            vote = (vote[1] === "1" ? "+" : "-") + vote.slice(2);

            if (data.asset && data.asset.votes) {
                data.asset.votes.push(vote);
            }
        }
    }
}
