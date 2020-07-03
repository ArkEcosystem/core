import { Services } from "@arkecosystem/core-kernel";

export function getWalletAttributeSet(): Services.Attributes.AttributeSet {
    const attributes: Services.Attributes.AttributeSet = new Services.Attributes.AttributeSet();
    attributes.set("delegate.approval");
    attributes.set("delegate.forgedFees");
    attributes.set("delegate.forgedRewards");
    attributes.set("delegate.forgedTotal");
    attributes.set("delegate.lastBlock");
    attributes.set("delegate.producedBlocks");
    attributes.set("delegate.rank");
    attributes.set("delegate.resigned");
    attributes.set("delegate.round");
    attributes.set("delegate.username");
    attributes.set("delegate.voteBalance");
    attributes.set("delegate");
    attributes.set("htlc.lockedBalance");
    attributes.set("htlc.locks");
    attributes.set("htlc");
    attributes.set("ipfs.hashes");
    attributes.set("ipfs");
    attributes.set("multiSignature");
    attributes.set("multiSignature.legacy");
    attributes.set("secondPublicKey");
    attributes.set("vote");

    return attributes;
}

export const knownAttributes: Services.Attributes.AttributeMap = new Services.Attributes.AttributeMap(
    getWalletAttributeSet(),
);
