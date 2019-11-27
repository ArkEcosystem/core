import { Services } from "@arkecosystem/core-kernel";

const atrributes: Services.Attributes.AttributeSet = new Services.Attributes.AttributeSet();
atrributes.set("delegate.approval");
atrributes.set("delegate.forgedFees");
atrributes.set("delegate.forgedRewards");
atrributes.set("delegate.forgedTotal");
atrributes.set("delegate.lastBlock");
atrributes.set("delegate.producedBlocks");
atrributes.set("delegate.rank");
atrributes.set("delegate.resigned");
atrributes.set("delegate.round");
atrributes.set("delegate.username");
atrributes.set("delegate.voteBalance");
atrributes.set("delegate");
atrributes.set("htlc.lockedBalance");
atrributes.set("htlc.locks");
atrributes.set("ipfs.hashes");
atrributes.set("ipfs");
atrributes.set("multiSignature");
atrributes.set("secondPublicKey");
atrributes.set("vote");

export const knownAttributes: Services.Attributes.AttributeMap = new Services.Attributes.AttributeMap(atrributes);
