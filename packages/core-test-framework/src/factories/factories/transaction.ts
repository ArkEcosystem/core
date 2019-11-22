import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import secrets from "../../internal/secrets.json";
import { FactoryBuilder } from "../factory-builder";
import { FactoryFunctionOptions } from "../types";

const sign = ({ entity, options }: FactoryFunctionOptions) => entity.sign(options.passphrase || secrets[0]);

const secondSign = ({ entity, options }: FactoryFunctionOptions) => entity.secondSign(options.passphrase || secrets[1]);

const multiSign = ({ entity, options }: FactoryFunctionOptions) => {
    Managers.configManager.getMilestone().aip11 = true; // todo: remove this after reworking the crypto package

    const passphrases: string[] = options.passphrases || [secrets[0], secrets[1], secrets[2]];

    for (let i = 0; i < passphrases.length; i++) {
        entity.multiSign(passphrases[i], i);
    }

    Managers.configManager.getMilestone().aip11 = false; // todo: remove this after reworking the crypto package

    return entity;
};

export const registerTransferFactory = (factory: FactoryBuilder): void => {
    factory.set("Transfer", ({ options }) =>
        Transactions.BuilderFactory.transfer()
            .amount(Utils.BigNumber.make(options.amount || 1).toFixed())
            .recipientId(options.recipientId || Identities.Address.fromPassphrase(secrets[0])),
    );

    factory
        .get("Transfer")
        .state("vendorField", ({ entity, options }) => entity.vendorField(options.vendorField || "Hello World"));

    factory.get("Transfer").state("sign", sign);
    factory.get("Transfer").state("secondSign", secondSign);
    factory.get("Transfer").state("multiSign", multiSign);
};

export const registerSecondSignatureFactory = (factory: FactoryBuilder): void => {
    factory.set("SecondSignature", () => {});
    factory.get("SecondSignature").state("sign", sign);
    factory.get("SecondSignature").state("secondSign", secondSign);
};

export const registerDelegateRegistrationFactory = (factory: FactoryBuilder): void => {
    factory.set("DelegateRegistration", () => {});
    factory.get("DelegateRegistration").state("sign", sign);
    factory.get("DelegateRegistration").state("secondSign", secondSign);
};

export const registerDelegateResignationFactory = (factory: FactoryBuilder): void => {
    factory.set("DelegateResignation", () => {});
    factory.get("DelegateResignation").state("sign", sign);
    factory.get("DelegateResignation").state("secondSign", secondSign);
};

export const registerVoteFactory = (factory: FactoryBuilder): void => {
    factory.set("Vote", () => {});
    factory.get("Vote").state("sign", sign);
    factory.get("Vote").state("secondSign", secondSign);
    factory.get("Vote").state("multiSign", multiSign);
};

export const registerUnvoteFactory = (factory: FactoryBuilder): void => {
    factory.set("Unvote", () => {});
    factory.get("Unvote").state("sign", sign);
    factory.get("Unvote").state("secondSign", secondSign);
    factory.get("Unvote").state("multiSign", multiSign);
};

export const registerMultiSignatureFactory = (factory: FactoryBuilder): void => {
    factory.set("MultiSignature", () => {});
    factory.get("MultiSignature").state("sign", sign);
    factory.get("MultiSignature").state("multiSign", multiSign);
};

export const registerIpfsFactory = (factory: FactoryBuilder): void => {
    factory.set("Ipfs", () => {});
    factory.get("Ipfs").state("sign", sign);
    factory.get("Ipfs").state("secondSign", secondSign);
    factory.get("Ipfs").state("multiSign", multiSign);
};

export const registerHtlcLockFactory = (factory: FactoryBuilder): void => {
    factory.set("HtlcLock", () => {});
    factory.get("HtlcLock").state("sign", sign);
    factory.get("HtlcLock").state("secondSign", secondSign);
    factory.get("HtlcLock").state("multiSign", multiSign);
};

export const registerHtlcClaimFactory = (factory: FactoryBuilder): void => {
    factory.set("HtlcClaim", () => {});
    factory.get("HtlcClaim").state("sign", sign);
    factory.get("HtlcClaim").state("secondSign", secondSign);
    factory.get("HtlcClaim").state("multiSign", multiSign);
};

export const registerHtlcRefundFactory = (factory: FactoryBuilder): void => {
    factory.set("Ipfs", () => {});
    factory.get("Ipfs").state("sign", sign);
    factory.get("Ipfs").state("secondSign", secondSign);
    factory.get("Ipfs").state("multiSign", multiSign);

    // HTLC Lock
    factory.set("HtlcLock", () => {});
    factory.get("HtlcLock").state("sign", sign);
    factory.get("HtlcLock").state("secondSign", secondSign);
    factory.get("HtlcLock").state("multiSign", multiSign);

    // HTLC Claim
    factory.set("HtlcClaim", () => {});
    factory.get("HtlcClaim").state("sign", sign);
    factory.get("HtlcClaim").state("secondSign", secondSign);
    factory.get("HtlcClaim").state("multiSign", multiSign);

    // HTLC Refund
    factory.set("HtlcRefund", () => {});
    factory.get("HtlcRefund").state("sign", sign);
    factory.get("HtlcRefund").state("secondSign", secondSign);
    factory.get("HtlcRefund").state("multiSign", multiSign);
};

export const registerMultiPaymentFactory = (factory: FactoryBuilder): void => {
    factory.set("MultiPayment", () => {});
    factory.get("MultiPayment").state("sign", sign);
    factory.get("MultiPayment").state("secondSign", secondSign);
    factory.get("MultiPayment").state("multiSign", multiSign);
};

export const registerBusinessRegistrationFactory = (factory: FactoryBuilder): void => {
    factory.set("BusinessRegistration", () => {});
    factory.get("BusinessRegistration").state("sign", sign);
    factory.get("BusinessRegistration").state("secondSign", secondSign);
    factory.get("BusinessRegistration").state("multiSign", multiSign);
};

export const registerBusinessResignationFactory = (factory: FactoryBuilder): void => {
    factory.set("BusinessResignation", () => {});
    factory.get("BusinessResignation").state("sign", sign);
    factory.get("BusinessResignation").state("secondSign", secondSign);
    factory.get("BusinessResignation").state("multiSign", multiSign);
};

export const registerBusinessUpdateFactory = (factory: FactoryBuilder): void => {
    factory.set("BusinessUpdate", () => {});
    factory.get("BusinessUpdate").state("sign", sign);
    factory.get("BusinessUpdate").state("secondSign", secondSign);
    factory.get("BusinessUpdate").state("multiSign", multiSign);
};

export const registerBridgechainRegistrationFactory = (factory: FactoryBuilder): void => {
    factory.set("BridgechainRegistration", () => {});
    factory.get("BridgechainRegistration").state("sign", sign);
    factory.get("BridgechainRegistration").state("secondSign", secondSign);
    factory.get("BridgechainRegistration").state("multiSign", multiSign);
};

export const registerBridgechainResignationFactory = (factory: FactoryBuilder): void => {
    factory.set("BridgechainResignation", () => {});
    factory.get("BridgechainResignation").state("sign", sign);
    factory.get("BridgechainResignation").state("secondSign", secondSign);
    factory.get("BridgechainResignation").state("multiSign", multiSign);
};

export const registerBridgechainUpdateFactory = (factory: FactoryBuilder): void => {
    factory.set("BridgechainUpdate", () => {});
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
