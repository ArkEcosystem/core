import {
    Builders as MagistrateBuilders,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Enums } from "@arkecosystem/crypto";
import bs58 from "bs58";
import Chance from "chance";
import { createHash } from "crypto";

import secrets from "../../internal/passphrases.json";
import { FactoryBuilder } from "../factory-builder";
import { FactoryFunctionOptions } from "../types";

const chance: Chance = new Chance();

const randomHash = (): string => createHash("sha256").update(Math.random().toString(36).substring(8)).digest("hex");

const sign = ({ entity, options }: FactoryFunctionOptions) => entity.sign(options.passphrase || secrets[0]);

const secondSign = ({ entity, options }: FactoryFunctionOptions) => entity.secondSign(options.passphrase || secrets[1]);

const multiSign = ({ entity, options }: FactoryFunctionOptions) => {
    const passphrases: string[] = options.passphrases || [secrets[0], secrets[1], secrets[2]];

    for (let i = 0; i < passphrases.length; i++) {
        entity.multiSign(passphrases[i], i);
    }

    return entity;
};

const applyModifiers = (entity, options) => {
    if (options.version) {
        entity.version(options.version);
    }

    if (entity.data.version > 1 && options.nonce) {
        entity.nonce(options.nonce);
    }

    if (options.fee) {
        entity.fee(options.fee.toFixed());
    }

    if (options.timestamp) {
        entity.data.timestamp = options.timestamp;
    }

    if (options.senderPublicKey) {
        entity.senderPublicKey(options.senderPublicKey);
    }

    if (options.expiration) {
        entity.expiration(options.expiration);
    }

    return entity;
};

export const registerTransferFactory = (factory: FactoryBuilder): void => {
    factory.set("Transfer", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.transfer()
                .amount(factory.cryptoManager.LibraryManager.Libraries.BigNumber.make(options.amount || 1).toFixed())
                .recipientId(
                    options.recipientId || factory.cryptoManager.Identities.Address.fromPassphrase(secrets[0]),
                ),
            options,
        ),
    );

    factory
        .get("Transfer")
        .state("vendorField", ({ entity, options }) => entity.vendorField(options.vendorField || "Hello World"));

    factory.get("Transfer").state("sign", sign);
    factory.get("Transfer").state("secondSign", secondSign);
    factory.get("Transfer").state("multiSign", multiSign);
};

export const registerSecondSignatureFactory = (factory: FactoryBuilder): void => {
    factory.set("SecondSignature", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.secondSignature().signatureAsset(
                options.passphrase || secrets[1],
            ),
            options,
        ),
    );

    factory.get("SecondSignature").state("sign", sign);
    factory.get("SecondSignature").state("secondSign", secondSign);
};

export const registerDelegateRegistrationFactory = (factory: FactoryBuilder): void => {
    factory.set("DelegateRegistration", ({ options }) =>
        factory.transactionManager.BuilderFactory.delegateRegistration().usernameAsset(
            options.username || Math.random().toString(36).substring(8),
        ),
    );

    factory.get("DelegateRegistration").state("sign", sign);
    factory.get("DelegateRegistration").state("secondSign", secondSign);
};

export const registerDelegateResignationFactory = (factory: FactoryBuilder): void => {
    factory.set("DelegateResignation", () => factory.transactionManager.BuilderFactory.delegateResignation());
    factory.get("DelegateResignation").state("sign", sign);
    factory.get("DelegateResignation").state("secondSign", secondSign);
};

export const registerVoteFactory = (factory: FactoryBuilder): void => {
    factory.set("Vote", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.vote().votesAsset([
                `+${options.publicKey || factory.cryptoManager.Identities.PublicKey.fromPassphrase(secrets[1])}`,
            ]),
            options,
        ),
    );

    factory.get("Vote").state("sign", sign);
    factory.get("Vote").state("secondSign", secondSign);
    factory.get("Vote").state("multiSign", multiSign);
};

export const registerUnvoteFactory = (factory: FactoryBuilder): void => {
    factory.set("Unvote", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.vote().votesAsset([
                `-${options.publicKey || factory.cryptoManager.Identities.PublicKey.fromPassphrase(secrets[1])}`,
            ]),
            options,
        ),
    );

    factory.get("Unvote").state("sign", sign);
    factory.get("Unvote").state("secondSign", secondSign);
    factory.get("Unvote").state("multiSign", multiSign);
};

export const registerMultiSignatureFactory = (factory: FactoryBuilder): void => {
    factory.set("MultiSignature", ({ options }) => {
        const builder = applyModifiers(factory.transactionManager.BuilderFactory.multiSignature(), options);

        const publicKeys: string[] = options.publicKeys || [
            factory.cryptoManager.Identities.PublicKey.fromPassphrase(secrets[0]),
            factory.cryptoManager.Identities.PublicKey.fromPassphrase(secrets[1]),
            factory.cryptoManager.Identities.PublicKey.fromPassphrase(secrets[2]),
        ];

        builder
            .multiSignatureAsset({
                publicKeys,
                min: options.min || 2,
            })
            .senderPublicKey(publicKeys[0]);

        return builder;
    });

    factory.get("MultiSignature").state("sign", sign);
    factory.get("MultiSignature").state("multiSign", multiSign);
};

export const registerIpfsFactory = (factory: FactoryBuilder): void => {
    factory.set("Ipfs", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.ipfs().ipfsAsset(
                options.id || bs58.encode(Buffer.from(randomHash(), "hex")),
            ),
            options,
        ),
    );

    factory.get("Ipfs").state("sign", sign);
    factory.get("Ipfs").state("secondSign", secondSign);
    factory.get("Ipfs").state("multiSign", multiSign);
};

export const registerHtlcLockFactory = (factory: FactoryBuilder): void => {
    factory.set("HtlcLock", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.htlcLock().htlcLockAsset({
                secretHash: options.secretHash || randomHash(),
                expiration: options.expiration || {
                    type: Enums.HtlcLockExpirationType.EpochTimestamp,
                    value: Math.floor(Date.now() / 1000),
                },
            }),
            options,
        ),
    );

    factory.get("HtlcLock").state("sign", sign);
    factory.get("HtlcLock").state("secondSign", secondSign);
    factory.get("HtlcLock").state("multiSign", multiSign);
};

export const registerHtlcClaimFactory = (factory: FactoryBuilder): void => {
    factory.set("HtlcClaim", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.htlcClaim().htlcClaimAsset({
                lockTransactionId: options.lockTransactionId || randomHash(),
                unlockSecret: options.unlockSecret || Math.random().toString(36).substring(8),
            }),
            options,
        ),
    );

    factory.get("HtlcClaim").state("sign", sign);
    factory.get("HtlcClaim").state("secondSign", secondSign);
    factory.get("HtlcClaim").state("multiSign", multiSign);
};

export const registerHtlcRefundFactory = (factory: FactoryBuilder): void => {
    factory.set("HtlcRefund", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.htlcRefund().htlcRefundAsset({
                lockTransactionId: options.lockTransactionId || randomHash(),
            }),
            options,
        ),
    );

    factory.get("HtlcRefund").state("sign", sign);
    factory.get("HtlcRefund").state("secondSign", secondSign);
    factory.get("HtlcRefund").state("multiSign", multiSign);
};

export const registerMultiPaymentFactory = (factory: FactoryBuilder): void => {
    factory.set("MultiPayment", ({ options }) =>
        applyModifiers(
            factory.transactionManager.BuilderFactory.multiPayment().addPayment(
                options.recipientId || factory.cryptoManager.Identities.Address.fromPassphrase(secrets[0]),
                factory.cryptoManager.LibraryManager.Libraries.BigNumber.make(options.amount || 1).toFixed(),
            ),
            options,
        ),
    );

    factory.get("MultiPayment").state("sign", sign);
    factory.get("MultiPayment").state("secondSign", secondSign);
    factory.get("MultiPayment").state("multiSign", multiSign);
};

export const registerBusinessRegistrationFactory = (factory: FactoryBuilder): void => {
    try {
        factory.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
    } catch {}

    factory.set("BusinessRegistration", ({ options }) =>
        applyModifiers(
            new MagistrateBuilders.BusinessRegistrationBuilder(
                factory.cryptoManager,
                factory.transactionManager.TransactionFactory,
                factory.transactionManager.TransactionTools,
            ).businessRegistrationAsset({
                name: options.name || chance.first(),
                website: options.website || chance.domain(),
            }),
            options,
        ),
    );

    factory.get("BusinessRegistration").state("sign", sign);
    factory.get("BusinessRegistration").state("secondSign", secondSign);
    factory.get("BusinessRegistration").state("multiSign", multiSign);
};

export const registerBusinessResignationFactory = (factory: FactoryBuilder): void => {
    try {
        factory.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
            MagistrateTransactions.BusinessResignationTransaction,
        );
    } catch {}

    factory.set("BusinessResignation", ({ options }) =>
        applyModifiers(
            new MagistrateBuilders.BusinessResignationBuilder(
                factory.cryptoManager,
                factory.transactionManager.TransactionFactory,
                factory.transactionManager.TransactionTools,
            ),
            options,
        ),
    );

    factory.get("BusinessResignation").state("sign", sign);
    factory.get("BusinessResignation").state("secondSign", secondSign);
    factory.get("BusinessResignation").state("multiSign", multiSign);
};

export const registerBusinessUpdateFactory = (factory: FactoryBuilder): void => {
    try {
        factory.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
            MagistrateTransactions.BusinessUpdateTransaction,
        );
    } catch {}

    factory.set("BusinessUpdate", ({ options }) =>
        applyModifiers(
            new MagistrateBuilders.BusinessUpdateBuilder(
                factory.cryptoManager,
                factory.transactionManager.TransactionFactory,
                factory.transactionManager.TransactionTools,
            ).businessUpdateAsset({
                name: options.name || chance.first(),
                website: options.website || chance.domain(),
                vat: options.vat,
                repository: options.repository || chance.domain(),
            }),
            options,
        ),
    );

    factory.get("BusinessUpdate").state("sign", sign);
    factory.get("BusinessUpdate").state("secondSign", secondSign);
    factory.get("BusinessUpdate").state("multiSign", multiSign);
};

export const registerBridgechainRegistrationFactory = (factory: FactoryBuilder): void => {
    try {
        factory.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}

    factory.set("BridgechainRegistration", ({ options }) =>
        applyModifiers(
            new MagistrateBuilders.BridgechainRegistrationBuilder(
                factory.cryptoManager,
                factory.transactionManager.TransactionFactory,
                factory.transactionManager.TransactionTools,
            ).bridgechainRegistrationAsset({
                name: options.name || chance.first(),
                seedNodes: options.seedNodes || [chance.ip(), chance.ip(), chance.ip()],
                genesisHash: options.genesisHash || randomHash(),
                bridgechainRepository: options.bridgechainRepository || chance.domain(),
                ports: options.ports || { "@arkecosystem/core-api": chance.port() },
            }),
            options,
        ),
    );

    factory.get("BridgechainRegistration").state("sign", sign);
    factory.get("BridgechainRegistration").state("secondSign", secondSign);
    factory.get("BridgechainRegistration").state("multiSign", multiSign);
};

export const registerBridgechainResignationFactory = (factory: FactoryBuilder): void => {
    try {
        factory.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
            MagistrateTransactions.BridgechainResignationTransaction,
        );
    } catch {}

    factory.set("BridgechainResignation", ({ options }) =>
        applyModifiers(
            new MagistrateBuilders.BridgechainResignationBuilder(
                factory.cryptoManager,
                factory.transactionManager.TransactionFactory,
                factory.transactionManager.TransactionTools,
            ).bridgechainResignationAsset(options.genesisHash || randomHash()),
            options,
        ),
    );

    factory.get("BridgechainResignation").state("sign", sign);
    factory.get("BridgechainResignation").state("secondSign", secondSign);
    factory.get("BridgechainResignation").state("multiSign", multiSign);
};

export const registerBridgechainUpdateFactory = (factory: FactoryBuilder): void => {
    try {
        factory.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(
            MagistrateTransactions.BridgechainUpdateTransaction,
        );
    } catch {}

    factory.set("BridgechainUpdate", ({ options }) =>
        applyModifiers(
            new MagistrateBuilders.BridgechainUpdateBuilder(
                factory.cryptoManager,
                factory.transactionManager.TransactionFactory,
                factory.transactionManager.TransactionTools,
            ).bridgechainUpdateAsset({
                bridgechainId: options.bridgechainId || randomHash(),
                seedNodes: options.seedNodes || [chance.ip(), chance.ip(), chance.ip()],
                ports: options.ports || { "@arkecosystem/core-api": chance.port() },
            }),
            options,
        ),
    );

    factory.get("BridgechainUpdate").state("sign", sign);
    factory.get("BridgechainUpdate").state("secondSign", secondSign);
    factory.get("BridgechainUpdate").state("multiSign", multiSign);
};

export const registerTransactionFactory = (factory: FactoryBuilder): void => {
    registerTransferFactory(factory);

    registerSecondSignatureFactory(factory);

    registerDelegateRegistrationFactory(factory);

    registerDelegateResignationFactory(factory);

    registerVoteFactory(factory);

    registerUnvoteFactory(factory);

    registerMultiSignatureFactory(factory);

    registerIpfsFactory(factory);

    registerHtlcLockFactory(factory);

    registerHtlcClaimFactory(factory);

    registerHtlcRefundFactory(factory);

    registerMultiPaymentFactory(factory);

    registerBusinessRegistrationFactory(factory);

    registerBusinessResignationFactory(factory);

    registerBusinessUpdateFactory(factory);

    registerBridgechainRegistrationFactory(factory);

    registerBridgechainResignationFactory(factory);

    registerBridgechainUpdateFactory(factory);
};
