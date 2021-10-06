import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { consensus } from "./proto/protos";

const hardLimitNumberOfTransactions = 500; // TODO: From setup

export const createBlockProposal = {
    request: {
        serialize: (data: Contracts.P2P.CreateBlockProposalRequest): Buffer => {
            const txBuffers: Buffer[] = [];
            for (const txBuffer of data.payload.transactions) {
                const txLengthBuffer = Buffer.alloc(4);
                txLengthBuffer.writeUInt32BE(txBuffer.byteLength);
                txBuffers.push(txLengthBuffer, txBuffer);
            }

            const obj = {
                blockHash: data.blockHash,
                height: data.height,
                generatorPublicKey: data.generatorPublicKey,
                signature: data.signature,
                timestamp: data.timestamp,
                payload: {
                    version: data.payload.version,
                    generatorPublicKey: data.payload.generatorPublicKey,
                    timestamp: data.payload.timestamp,
                    previousBlock: data.payload.previousBlock,
                    height: data.payload.height,
                    numberOfTransactions: data.payload.numberOfTransactions,
                    totalAmount: data.payload.totalAmount.toString(),
                    totalFee: data.payload.totalFee.toString(),
                    reward: data.payload.reward.toString(),
                    payloadLength: data.payload.payloadLength,
                    payloadHash: data.payload.payloadHash,
                    transactions: Buffer.concat(txBuffers),
                    signatures: data.payload.signatures,
                },
                headers: data.headers,
            };

            return Buffer.from(consensus.CreateBlockProposalRequest.encode(obj).finish());
        },
        deserialize: (payload: Buffer): Contracts.P2P.CreateBlockProposalRequest => {
            const decoded = consensus.CreateBlockProposalRequest.decode(payload);

            AppUtils.assert.defined(decoded.payload);
            AppUtils.assert.defined(decoded.payload!.transactions);

            const txsBuffer = Buffer.from(decoded.payload!.transactions!);
            const txs: Buffer[] = [];
            for (let offset = 0; offset < txsBuffer.byteLength - 4; ) {
                const txLength = txsBuffer.readUInt32BE(offset);
                txs.push(txsBuffer.slice(offset + 4, offset + 4 + txLength));
                offset += 4 + txLength;

                if (txs.length >= hardLimitNumberOfTransactions) {
                    break;
                }
            }

            return {
                blockHash: decoded.blockHash,
                height: decoded.height,
                generatorPublicKey: decoded.generatorPublicKey,
                signature: decoded.signature,
                timestamp: decoded.timestamp,
                payload: {
                    version: decoded.payload!.version!,
                    generatorPublicKey: decoded.payload!.generatorPublicKey!,
                    timestamp: decoded.payload!.timestamp!,
                    previousBlock: decoded.payload!.previousBlock!,
                    height: decoded.payload!.height!,
                    numberOfTransactions: decoded.payload!.numberOfTransactions!,
                    totalAmount: new Utils.BigNumber(decoded.payload?.totalAmount as string),
                    totalFee: new Utils.BigNumber(decoded.payload?.totalFee as string),
                    reward: new Utils.BigNumber(decoded.payload?.reward as string),
                    payloadLength: decoded.payload!.payloadLength!,
                    payloadHash: decoded.payload!.payloadHash!,
                    transactions: txs,
                    signatures: decoded.payload!.signatures!,
                },
                headers: decoded.headers,
            };
        },
    },
    response: {
        serialize: (obj: Contracts.P2P.CreateBlockProposalResponse): Buffer =>
            Buffer.from(consensus.CreateBlockProposalResponse.encode(obj).finish()),
        deserialize: (payload: Buffer): Contracts.P2P.CreateBlockProposalResponse =>
            consensus.CreateBlockProposalResponse.decode(payload),
    },
};
