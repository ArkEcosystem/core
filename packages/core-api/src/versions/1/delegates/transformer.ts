import { delegateCalculator } from "@arkecosystem/core-utils";

export default function(delegate) {
  return {
    username: delegate.username,
    address: delegate.address,
    publicKey: delegate.publicKey,
    vote: `${delegate.voteBalance}`,
    producedblocks: delegate.producedBlocks,
    missedblocks: delegate.missedBlocks,
    forged: delegate.forged,
    rate: delegate.rate,
    approval: delegateCalculator.calculateApproval(delegate),
    productivity: delegateCalculator.calculateProductivity(delegate),
  };
}
