import { Utils } from "@arkecosystem/crypto";
import { blocks } from "./proto/protos";

export const getBlocks = {
    request: {
        serialize: (obj: blocks.IGetBlocksRequest): Buffer => Buffer.from(blocks.GetBlocksRequest.encode(obj).finish()),
        deserialize: (payload: Buffer): blocks.IGetBlocksRequest => blocks.GetBlocksRequest.decode(payload),
    },
    response: {
        serialize: (obj): Buffer => {
            return Buffer.from(blocks.GetBlocksResponse.encode(
                {
                    blocks: obj.map(b => ({
                        ...b,
                        totalAmount: b.totalAmount.toString(),
                        totalFee: b.totalFee.toString(),
                        reward: b.reward.toString(),
                    }))
                }
            ).finish());
        },
        deserialize: (payload: Buffer) => blocks.GetBlocksResponse.decode(payload).blocks.map(b => ({
            ...b,
            totalAmount: new Utils.BigNumber(b.totalAmount as string),
            totalFee: new Utils.BigNumber(b.totalFee as string),
            reward: new Utils.BigNumber(b.reward as string),
        })),
    },
};

export const postBlock = {
    request: {
        serialize: (obj: blocks.IPostBlockRequest): Buffer => Buffer.from(blocks.PostBlockRequest.encode(obj).finish()),
        deserialize: (payload: Buffer) => {
            const decoded = blocks.PostBlockRequest.decode(payload);
            return {
                block: Buffer.from(decoded.block),
            };
        },
    },
    response: {
        serialize: (status: boolean): Buffer => {
            const buf = Buffer.alloc(1);
            buf.writeUInt8(status ? 1 : 0);
            return buf;
        },
        deserialize: (payload: Buffer): boolean => !!payload.readUInt8(),
    },
};
