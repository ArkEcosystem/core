import "jest-extended";

import _ from "lodash";

import { buildSenderWallet, initApp } from "../__support__/app";
import { CryptoSuite, Interfaces as BlockInterfaces } from "../../../../packages/core-crypto";
import { Application, Contracts } from "../../../../packages/core-kernel";
import { Identifiers } from "../../../../packages/core-kernel/src/ioc";
import { Enums, Transactions as MagistrateTransactions } from "../../../../packages/core-magistrate-crypto";
import { BusinessRegistrationBuilder } from "../../../../packages/core-magistrate-crypto/src/builders";
import { StaticFeeMismatchError } from "../../../../packages/core-magistrate-transactions/src/errors";
import { BusinessRegistrationTransactionHandler } from "../../../../packages/core-magistrate-transactions/src/handlers";
import { Wallets } from "../../../../packages/core-state";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { Generators } from "../../../../packages/core-test-framework/src";
import { Mocks } from "../../../../packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "../../../../packages/core-test-framework/src/factories";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandler } from "../../../../packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "../../../../packages/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions } from "../../../../packages/crypto";
import { Assets } from "./__fixtures__";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;

let crypto: CryptoSuite.CryptoSuite;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;
let mockGetLastBlock;

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    crypto = new CryptoSuite.CryptoSuite(config);
    crypto.CryptoManager.HeightTracker.setHeight(2);

    Mocks.TransactionRepository.setTransactions([]);

    app = initApp(crypto);
    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };
    mockGetLastBlock = jest.fn();
    StateStore.prototype.getLastBlock = mockGetLastBlock;
    mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder(crypto);
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app, crypto.CryptoManager);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.MagistrateTransactionType.BusinessRegistration,
                Enums.MagistrateTransactionGroup,
            ),
            2,
        );

        const builder = new BusinessRegistrationBuilder(
            crypto.CryptoManager,
            crypto.TransactionManager.TransactionFactory,
            crypto.TransactionManager.TransactionTools,
        );

        const businessRegistrationAsset = _.cloneDeep(Assets.businessRegistrationAsset);

        businessRegistrationTransaction = builder
            .businessRegistrationAsset(businessRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    afterEach(() => {
        try {
            crypto.TransactionManager.TransactionTools.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
        } catch {}
    });

    describe("throwIfCannotBeApplied", () => {
        // let pubKeyHash: number;

        // beforeEach(() => {
        //     pubKeyHash = configManager.get("network.pubKeyHash");
        // });

        // afterEach(() => {
        //     configManager.set("exceptions.transactions", []);
        //     configManager.set("network.pubKeyHash", pubKeyHash);
        //     // Trigger whitelistedBlockAndTransactionIds recalculation
        //     Utils.isException(businessRegistrationTransaction.data.id);
        // });

        it("should not throw defined as exception", async () => {
            // configManager.set("network.pubKeyHash", 99);
            // configManager.set("exceptions.transactions", [businessRegistrationTransaction.data.id]);

            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should throw on fee mismatch", async () => {
            businessRegistrationTransaction.data.fee = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            await expect(
                handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository),
            ).rejects.toThrowError(StaticFeeMismatchError);
        });
    });

    describe("dynamicFees", () => {
        it("should return correct number", async () => {
            expect(
                handler.dynamicFee({
                    transaction: businessRegistrationTransaction,
                    addonBytes: 178,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("5000000000"));
        });
    });
});
