import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import { Application, Contracts, Services } from "@arkecosystem/core-kernel";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { IMultiSignatureAsset } from "@arkecosystem/crypto/src/interfaces";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { configManager } from "@packages/crypto/src/managers";
import { getWalletAttributeSet } from "@arkecosystem/core-test-framework/src/internal/wallet-attributes";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import {
    buildMultiSignatureWallet,
    buildRecipientWallet,
    buildSecondSignatureWallet,
    buildSenderWallet,
    initApp,
} from "../__support__/app";
import { LegacyMultiSignatureError } from "@arkecosystem/core-transactions/src/errors";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let multiSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };

const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue( { data: mockLastBlockData } );

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);
    configManager.getMilestone().aip11 = false;
    Managers.configManager.getMilestone().aip11 = false;

    setMockTransaction(null);

    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder);
    multiSignatureWallet = buildMultiSignatureWallet();
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.reindex(senderWallet);
    walletRepository.reindex(secondSignatureWallet);
    walletRepository.reindex(multiSignatureWallet);
    walletRepository.reindex(recipientWallet);
});

describe("MultiSignatureRegistrationTransaction", () => {
    let multiSignatureTransaction: Interfaces.ITransaction;
    let recipientWallet: Wallets.Wallet;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.TransactionType.MultiSignature, Enums.TransactionTypeGroup.Core), 1);

        senderWallet.balance = Utils.BigNumber.make(100390000000);

        const multiSignatureAsset: IMultiSignatureAsset = {
            publicKeys: [
                Identities.PublicKey.fromPassphrase(passphrases[0]),
                Identities.PublicKey.fromPassphrase(passphrases[1]),
                Identities.PublicKey.fromPassphrase(passphrases[2]),
            ],
            min: 2,
        };

        recipientWallet = new Wallets.Wallet(Identities.Address.fromMultiSignatureAsset(multiSignatureAsset), new Services.Attributes.AttributeMap(getWalletAttributeSet()));

        walletRepository.reindex(recipientWallet);

        multiSignatureTransaction = BuilderFactory.multiSignature()
            .version(1)
            .multiSignatureAsset(multiSignatureAsset)
            .senderPublicKey(Identities.PublicKey.fromPassphrase(passphrases[0]))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .sign(passphrases[0])
            .build();
    });

    // TODO: Check why is bootstrap method if transaction is not supported
    // describe("bootstrap", () => {
    //     it("should resolve", async () => {
    //         setMockTransaction(multiSignatureTransaction);
    //         await expect(handler.bootstrap()).toResolve();
    //     })
    // });

    describe("throwIfCannotBeApplied", () => {
        it("should throw", async () => {
            await expect(handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository)).rejects.toThrow(LegacyMultiSignatureError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should throw", async () => {
            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(Contracts.TransactionPool.PoolError);
        });
    });
});
