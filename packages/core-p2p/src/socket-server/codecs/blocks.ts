import { Utils } from "@arkecosystem/crypto";
import { blocks } from "./proto/protos";

const hardLimitNumberOfBlocks = 400;
const hardLimitNumberOfTransactions = 400;

export const getBlocks = {
    request: {
        serialize: (obj: blocks.IGetBlocksRequest): Buffer => Buffer.from(blocks.GetBlocksRequest.encode(obj).finish()),
        deserialize: (payload: Buffer): blocks.IGetBlocksRequest => blocks.GetBlocksRequest.decode(payload),
    },
    response: {
        serialize: (obj): Buffer => {
            const blocksEncoded: Buffer[] = [];
            for (const block of obj) {
                const blockEncoded = blocks.GetBlocksResponse.BlockHeader.encode({
                    ...block,
                    totalAmount: block.totalAmount.toString(),
                    totalFee: block.totalFee.toString(),
                    reward: block.reward.toString(),
                    transactions: block.transactions ? block.transactions.reduce(
                        (acc, curr) => {
                            const txBuffer = Buffer.from(curr, "hex");
                            const txByteLength = Buffer.alloc(4);
                            txByteLength.writeUInt32BE(txBuffer.byteLength);
                            return Buffer.concat([acc, txByteLength, txBuffer]);
                        },
                        Buffer.alloc(0)
                    ) : Buffer.alloc(0),
                }).finish();
                blocksEncoded.push(Buffer.from(blockEncoded));
            }

            return blocksEncoded.reduce((acc, curr) => {
                    const txByteLength = Buffer.alloc(4);
                    txByteLength.writeUInt32BE(curr.byteLength);
                    return Buffer.concat([acc, txByteLength, curr]);
                },
                Buffer.alloc(0)
            );
        },
        deserialize: (payload: Buffer) => {
            const blocksBuffer = Buffer.from(payload);
            const blocksBuffers: Buffer[] = [];
            for (let offset = 0; offset < (blocksBuffer.byteLength - 4);) {
                const blockLength = blocksBuffer.readUInt32BE(offset);
                blocksBuffers.push(blocksBuffer.slice(offset + 4, offset + 4 + blockLength));
                offset += 4 + blockLength;
                if (blocksBuffers.length > hardLimitNumberOfBlocks) { break; }
            }

            return blocksBuffers.map(blockBuffer => {
                const blockWithTxBuffer = blocks.GetBlocksResponse.BlockHeader.decode(blockBuffer);
                const txsBuffer = Buffer.from(blockWithTxBuffer.transactions);
                const txs: string[] = [];
                for (let offset = 0; offset < (txsBuffer.byteLength - 4);) {
                    const txLength = txsBuffer.readUInt32BE(offset);
                    txs.push(txsBuffer.slice(offset + 4, offset + 4 + txLength).toString("hex"));
                    offset += 4 + txLength;
                    if (txs.length > hardLimitNumberOfTransactions) { break; }
                }
                return {
                    ...blockWithTxBuffer,
                    totalAmount: new Utils.BigNumber(blockWithTxBuffer.totalAmount as string),
                    totalFee: new Utils.BigNumber(blockWithTxBuffer.totalFee as string),
                    reward: new Utils.BigNumber(blockWithTxBuffer.reward as string),
                    transactions: txs,
                }
            })
        },
    },
};

export const postBlock = {
    request: {
        serialize: (obj: blocks.IPostBlockRequest): Buffer => Buffer.from(blocks.PostBlockRequest.encode(obj).finish()),
        deserialize: (payload: Buffer) => {
            const decoded = blocks.PostBlockRequest.decode(payload);
            return {
                ...decoded,
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
