import { consensus } from "./proto/protos";

export const createBlockProposal = {
    request: {
        serialize: (obj: consensus.ICreateBlockProposalRequest): Buffer =>
            Buffer.from(consensus.CreateBlockProposalRequest.encode(obj).finish()),
        deserialize: (payload: Buffer): consensus.ICreateBlockProposalRequest =>
            consensus.CreateBlockProposalRequest.decode(payload),
    },
    response: {
        serialize: (obj: consensus.ICreateBlockProposalResponse): Buffer =>
            Buffer.from(consensus.CreateBlockProposalResponse.encode(obj).finish()),
        deserialize: (payload: Buffer): consensus.ICreateBlockProposalResponse =>
            consensus.CreateBlockProposalResponse.decode(payload),
    },
};
