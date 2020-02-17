import { Services } from "@arkecosystem/core-kernel";

export const attributes: Services.Attributes.AttributeSet = new Services.Attributes.AttributeSet();
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
attributes.set("ipfs.hashes");
attributes.set("ipfs");
attributes.set("multiSignature");
attributes.set("secondPublicKey");
attributes.set("vote");

export const knownAttributes: Services.Attributes.AttributeMap = new Services.Attributes.AttributeMap(attributes);
