import "jest-extended";

import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Enums, Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Factories, FactoryBuilder } from "@arkecosystem/core-test-framework/src/factories";
import { Generators } from "@arkecosystem/core-test-framework/src";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { StateStore } from "@arkecosystem/core-state/src/stores/state";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Wallets } from "@arkecosystem/core-state";
import { buildSenderWallet, initApp } from "../__support__/app";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { setMockTransaction } from "../__mocks__/transaction-repository";
import { BusinessRegistrationBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { IBusinessRegistrationAsset } from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { StaticFeeMismatchError } from "@arkecosystem/core-magistrate-transactions/src/errors";
import { BusinessRegistrationTransactionHandler } from "@arkecosystem/core-magistrate-transactions/src/handlers";

let app: Application;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;
let transactionHandlerRegistry: TransactionHandlerRegistry;

const mockLastBlockData: Partial<Interfaces.IBlockData> = { timestamp: Crypto.Slots.getTime() , height: 4 };
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue( { data: mockLastBlockData } );

beforeEach(() => {
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);
    Managers.configManager.setConfig(config);

    setMockTransaction(null);

    app = initApp();

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    factoryBuilder = new FactoryBuilder();
    Factories.registerWalletFactory(factoryBuilder);

    senderWallet = buildSenderWallet(app);

    walletRepository.index(senderWallet);
});

describe("BusinessRegistration", () => {
    let businessRegistrationTransaction: Interfaces.ITransaction;
    let handler: TransactionHandler;

    beforeEach(async () => {
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(Transactions.InternalTransactionType.from(Enums.MagistrateTransactionType.BusinessRegistration, Enums.MagistrateTransactionGroup), 2);

        let builder = new BusinessRegistrationBuilder();

        let businessRegistrationAsset: IBusinessRegistrationAsset = {
            name: "DummyBusiness",
            website: "https://www.dummy.example",
            vat: "EX1234567890",
            repository: "https://www.dummy.example/repo"
        };

        businessRegistrationTransaction = builder
            .businessRegistrationAsset(businessRegistrationAsset)
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    afterEach(() => {
        try {
            Transactions.TransactionRegistry.deregisterTransactionType(
                MagistrateTransactions.BusinessRegistrationTransaction,
            );
        } catch {}
    });

    describe("throwIfCannotBeApplied", () => {
        let pubKeyHash: number;

        beforeEach(() => {
            pubKeyHash = configManager.get("network.pubKeyHash");
        });

        afterEach(() => {
            configManager.set("exceptions.transactions", []);
            configManager.set("network.pubKeyHash", pubKeyHash);
            // Trigger whitelistedBlockAndTransactionIds recalculation
            Utils.isException(businessRegistrationTransaction.data.id);
        });

        it("should not throw defined as exception", async () => {
            configManager.set("network.pubKeyHash", 99);
            configManager.set("exceptions.transactions", [businessRegistrationTransaction.data.id]);

            await expect(handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository)).toResolve();
        });

        it("should throw on fee mismatch", async () => {
            businessRegistrationTransaction.data.fee = Utils.BigNumber.ZERO;
            await expect(handler.throwIfCannotBeApplied(businessRegistrationTransaction, senderWallet, walletRepository)).rejects.toThrowError(StaticFeeMismatchError);
        });
    });

    describe("dynamicFees", () => {
        it("should return correct number", async () => {
            expect(handler.dynamicFee({ transaction: businessRegistrationTransaction, addonBytes: 178, satoshiPerByte: 3, height: 1 })).toEqual(
                Utils.BigNumber.make("5000000000")
            );
        });
    })
});
