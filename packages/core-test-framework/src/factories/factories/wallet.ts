import { Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Identities } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";

import { FactoryBuilder } from "../factory-builder";

export const registerWalletFactory = (factory: FactoryBuilder): void => {
    const knownAttributes: Services.Attributes.AttributeSet = new Services.Attributes.AttributeSet();
    knownAttributes.set("delegate.approval");
    knownAttributes.set("delegate.forgedFees");
    knownAttributes.set("delegate.forgedRewards");
    knownAttributes.set("delegate.forgedTotal");
    knownAttributes.set("delegate.lastBlock");
    knownAttributes.set("delegate.producedBlocks");
    knownAttributes.set("delegate.rank");
    knownAttributes.set("delegate.resigned");
    knownAttributes.set("delegate.round");
    knownAttributes.set("delegate.username");
    knownAttributes.set("delegate.voteBalance");
    knownAttributes.set("delegate");
    knownAttributes.set("htlc.lockedBalance");
    knownAttributes.set("htlc.locks");
    knownAttributes.set("ipfs.hashes");
    knownAttributes.set("ipfs");
    knownAttributes.set("multiSignature");
    knownAttributes.set("secondPublicKey");
    knownAttributes.set("vote");

    factory.set("Wallet", ({ options }) => {
        const passphrase: string = options.passphrase || generateMnemonic();

        const wallet: Wallets.Wallet = new Wallets.Wallet(
            Identities.Address.fromPassphrase(passphrase),
            new Services.Attributes.AttributeMap(knownAttributes),
        );
        wallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);

        return wallet;
    });

    factory.get("Wallet").state("secondPublicKey", ({ entity }) => {
        entity.setAttribute("secondPublicKey", Identities.PublicKey.fromPassphrase(generateMnemonic()));

        return entity;
    });
};
