import { Utils } from "@arkecosystem/crypto";

import { consensus } from "./proto/protos";

interface CreateBlockProposalData {
    blockHash: string;
    height: number;
    generatorPublicKey: string;
    signature: string;
    timestamp: number;
    payload: {
        version: number;
        generatorPublicKey: string;
        timestamp: number;
        previousBlock: string;
        height: number;
        numberOfTransactions: number;
        totalAmount: Utils.BigNumber;
        totalFee: Utils.BigNumber;
        reward: Utils.BigNumber;
        payloadLength: number;
        payloadHash: string;
        // transactions: string;
        signatures: string[];
    };
    headers: any;
}

export const createBlockProposal = {
    request: {
        serialize: (data: CreateBlockProposalData): Buffer => {
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
                    // transactions: string;
                    signatures: data.payload.signatures,
                },
                headers: data.headers,
            };

            return Buffer.from(consensus.CreateBlockProposalRequest.encode(obj).finish());
        },
        deserialize: (payload: Buffer): CreateBlockProposalData => {
            const decoded = consensus.CreateBlockProposalRequest.decode(payload);

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
                    // transactions: string;
                    signatures: decoded.payload!.signatures!,
                },
                headers: decoded.headers,
            };
        },
    },
    response: {
        serialize: (obj: consensus.ICreateBlockProposalResponse): Buffer =>
            Buffer.from(consensus.CreateBlockProposalResponse.encode(obj).finish()),
        deserialize: (payload: Buffer): consensus.ICreateBlockProposalResponse =>
            consensus.CreateBlockProposalResponse.decode(payload),
    },
};
