import { Handlers as MagistrateHandlers } from "@arkecosystem/core-magistrate-transactions";
import { Handlers } from "@arkecosystem/core-transactions";
import { TransactionFactory } from "../../../helpers/transaction-factory";

Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BusinessRegistrationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BusinessResignationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BusinessUpdateTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BridgechainRegistrationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BridgechainResignationTransactionHandler);
Handlers.Registry.registerTransactionHandler(MagistrateHandlers.BridgechainUpdateTransactionHandler);

const passphrase = "another dummy passphrase";
const staticFeeMagistrate = 50 * 1e8; // static fee set up for all magistrate txs
const dynamicFeeMagistrate = 45 * 1e8; // high enough fee to be accepted on dynamic fee
const lowFee = 1000; // too low for any tx

export const staticFeeTxs = {
    businessRegistration: TransactionFactory.businessRegistration({
        website: "http://website.cool",
        name: "cool biz",
    })
        .withNetwork("unitnet")
        .withFee(staticFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    businessUpdate: TransactionFactory.businessUpdate({
        website: "http://websiteupdated.cool",
    })
        .withNetwork("unitnet")
        .withFee(staticFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    businessResignation: TransactionFactory.businessResignation()
        .withNetwork("unitnet")
        .withFee(staticFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainRegistration: TransactionFactory.bridgechainRegistration({
        name: "cool bridge",
        seedNodes: ["10.11.12.13"],
        genesisHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
        ports: { "@arkecosystem/core-api": 12345 },
    })
        .withNetwork("unitnet")
        .withFee(staticFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainUpdate: TransactionFactory.bridgechainUpdate({
        bridgechainId: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        bridgechainRepository: "http://www.newrepository.com/myorg/myrepo",
    })
        .withNetwork("unitnet")
        .withFee(staticFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainResignation: TransactionFactory.bridgechainResignation(
        "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    )
        .withNetwork("unitnet")
        .withFee(staticFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],
};

export const dynamicFeeTxs = {
    businessRegistration: TransactionFactory.businessRegistration({
        website: "http://website.cool",
        name: "cool biz",
    })
        .withNetwork("unitnet")
        .withFee(dynamicFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    businessUpdate: TransactionFactory.businessUpdate({
        website: "http://websiteupdated.cool",
    })
        .withNetwork("unitnet")
        .withFee(dynamicFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    businessResignation: TransactionFactory.businessResignation()
        .withNetwork("unitnet")
        .withFee(dynamicFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainRegistration: TransactionFactory.bridgechainRegistration({
        name: "cool bridge",
        seedNodes: ["10.11.12.13"],
        genesisHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
        ports: { "@arkecosystem/core-api": 12345 },
    })
        .withNetwork("unitnet")
        .withFee(dynamicFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainUpdate: TransactionFactory.bridgechainUpdate({
        bridgechainId: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        bridgechainRepository: "http://www.newrepository.com/myorg/myrepo",
    })
        .withNetwork("unitnet")
        .withFee(dynamicFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainResignation: TransactionFactory.bridgechainResignation(
        "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    )
        .withNetwork("unitnet")
        .withFee(dynamicFeeMagistrate)
        .withPassphrase(passphrase)
        .build(1)[0],
};

export const lowFeeTxs = {
    businessRegistration: TransactionFactory.businessRegistration({
        website: "http://website.cool",
        name: "cool biz",
    })
        .withNetwork("unitnet")
        .withFee(lowFee)
        .withPassphrase(passphrase)
        .build(1)[0],

    businessUpdate: TransactionFactory.businessUpdate({
        website: "http://websiteupdated.cool",
    })
        .withNetwork("unitnet")
        .withFee(lowFee)
        .withPassphrase(passphrase)
        .build(1)[0],

    businessResignation: TransactionFactory.businessResignation()
        .withNetwork("unitnet")
        .withFee(lowFee)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainRegistration: TransactionFactory.bridgechainRegistration({
        name: "cool bridge",
        seedNodes: ["10.11.12.13"],
        genesisHash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
        ports: { "@arkecosystem/core-api": 12345 },
    })
        .withNetwork("unitnet")
        .withFee(lowFee)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainUpdate: TransactionFactory.bridgechainUpdate({
        bridgechainId: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        bridgechainRepository: "http://www.newrepository.com/myorg/myrepo",
    })
        .withNetwork("unitnet")
        .withFee(lowFee)
        .withPassphrase(passphrase)
        .build(1)[0],

    bridgechainResignation: TransactionFactory.bridgechainResignation(
        "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    )
        .withNetwork("unitnet")
        .withFee(lowFee)
        .withPassphrase(passphrase)
        .build(1)[0],
};
