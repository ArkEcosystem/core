import "jest-extended";

import { CryptoSuite, Interfaces as BlockInterfaces } from "@packages/core-crypto/src";
import { Application, Contracts, Services } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Wallets } from "@packages/core-state";
import { StateStore } from "@packages/core-state/src/stores/state";
import { Mapper, Mocks } from "@packages/core-test-framework/src";
import { Generators } from "@packages/core-test-framework/src";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { getWalletAttributeSet } from "@packages/core-test-framework/src/internal/wallet-attributes";
import { Mempool } from "@packages/core-transaction-pool/src/mempool";
import {
    InsufficientBalanceError,
    InvalidMultiSignatureError,
    MultiSignatureAlreadyRegisteredError,
    MultiSignatureKeyCountMismatchError,
    MultiSignatureMinimumKeysError,
    UnexpectedMultiSignatureError,
} from "@packages/core-transactions/src/errors";
import { TransactionHandler } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Enums, Errors, Interfaces, Transactions } from "@packages/crypto";
import { IMultiSignatureAsset, IMultiSignatureLegacyAsset } from "@packages/crypto/src/interfaces";

import { buildRecipientWallet, buildSecondSignatureWallet, buildSenderWallet, initApp } from "../__support__/app";

let app: Application;
let senderWallet: Wallets.Wallet;
let secondSignatureWallet: Wallets.Wallet;
let recipientWallet: Wallets.Wallet;
let walletRepository: Contracts.State.WalletRepository;
let factoryBuilder: FactoryBuilder;

let mockLastBlockData: Partial<BlockInterfaces.IBlockData>;
const mockGetLastBlock = jest.fn();
StateStore.prototype.getLastBlock = mockGetLastBlock;
mockGetLastBlock.mockReturnValue({ data: mockLastBlockData });

let crypto: CryptoSuite.CryptoSuite;

beforeEach(() => {
    crypto = new CryptoSuite.CryptoSuite({
        ...Generators.generateCryptoConfigRaw(),
    });
    crypto.CryptoManager.HeightTracker.setHeight(2);

    app = initApp(crypto);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    mockLastBlockData = { timestamp: crypto.CryptoManager.LibraryManager.Crypto.Slots.getTime(), height: 4 };

    factoryBuilder = new FactoryBuilder(crypto as any);
    Factories.registerWalletFactory(factoryBuilder);
    Factories.registerTransactionFactory(factoryBuilder);

    senderWallet = buildSenderWallet(factoryBuilder, crypto.CryptoManager);
    secondSignatureWallet = buildSecondSignatureWallet(factoryBuilder, crypto.CryptoManager);
    recipientWallet = buildRecipientWallet(factoryBuilder);

    walletRepository.index(senderWallet);
    walletRepository.index(secondSignatureWallet);
    walletRepository.index(recipientWallet);
});

afterEach(() => {
    Mocks.TransactionRepository.setTransactions([]);
});

describe("MultiSignatureRegistrationTransaction", () => {
    let multiSignatureTransaction: Interfaces.ITransaction;
    let secondSignatureMultiSignatureTransaction: Interfaces.ITransaction;
    let multiSignatureAsset: IMultiSignatureAsset;
    let handler: TransactionHandler;

    beforeEach(async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        handler = transactionHandlerRegistry.getRegisteredHandlerByType(
            Transactions.InternalTransactionType.from(
                Enums.TransactionType.MultiSignature,
                Enums.TransactionTypeGroup.Core,
            ),
            2,
        );

        senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(100390000000);

        multiSignatureAsset = {
            publicKeys: [
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
            ],
            min: 2,
        };

        recipientWallet = new Wallets.Wallet(
            crypto.CryptoManager,
            crypto.CryptoManager.Identities.Address.fromMultiSignatureAsset(multiSignatureAsset),
            new Services.Attributes.AttributeMap(getWalletAttributeSet()),
        );

        walletRepository.index(recipientWallet);

        multiSignatureTransaction = crypto.TransactionManager.BuilderFactory.multiSignature()
            .multiSignatureAsset(multiSignatureAsset)
            .senderPublicKey(senderWallet.publicKey!)
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign(passphrases[0], 0)
            .multiSign(passphrases[1], 1)
            .multiSign(passphrases[2], 2)
            .sign(passphrases[0])
            .build();

        secondSignatureMultiSignatureTransaction = crypto.TransactionManager.BuilderFactory.multiSignature()
            .multiSignatureAsset({
                publicKeys: [
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
                ],
                min: 2,
            })
            .senderPublicKey(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]))
            .nonce("1")
            .recipientId(recipientWallet.publicKey!)
            .multiSign(passphrases[1], 0)
            .multiSign(passphrases[0], 1)
            .multiSign(passphrases[2], 2)
            .sign(passphrases[1])
            .secondSign(passphrases[2])
            .build();
    });

    describe("bootstrap", () => {
        it("should resolve", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(multiSignatureTransaction)]);
            await expect(handler.bootstrap()).toResolve();
        });

        it("should throw if wallet is mutli signature", async () => {
            Mocks.TransactionRepository.setTransactions([Mapper.mapTransactionToModel(multiSignatureTransaction)]);
            recipientWallet.setAttribute("multiSignature", multiSignatureTransaction.data.asset!.multiSignature);
            await expect(handler.bootstrap()).rejects.toThrow(MultiSignatureAlreadyRegisteredError);
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).toResolve();
        });

        it("should not throw - second sign", async () => {
            await expect(
                handler.throwIfCannotBeApplied(
                    secondSignatureMultiSignatureTransaction,
                    secondSignatureWallet,
                    walletRepository,
                ),
            ).toResolve();
        });

        it("should throw if the wallet already has multisignatures", async () => {
            recipientWallet.setAttribute("multiSignature", multiSignatureTransaction.data.asset!.multiSignature);

            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(MultiSignatureAlreadyRegisteredError);
        });

        it("should throw if failure to verify signatures", async () => {
            handler.verifySignatures = jest.fn(() => false);
            senderWallet.forgetAttribute("multiSignature");

            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InvalidMultiSignatureError);
        });

        it("should throw with aip11 set to false and transaction is legacy", async () => {
            const legacyAssset: IMultiSignatureLegacyAsset = {
                keysgroup: [
                    "+039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    "+028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                    "+021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                ],
                min: 3,
                lifetime: 0,
                // @ts-ignore
                legacy: true,
            };

            multiSignatureTransaction.data.version = 1;
            multiSignatureTransaction.data.timestamp = 1000;
            multiSignatureTransaction.data.asset!.legacyAsset = legacyAssset;

            crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = false;

            handler.verifySignatures = jest.fn().mockReturnValue(true);

            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(UnexpectedMultiSignatureError);
            crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;
        });

        // TODO: check value 02 thwors DuplicateParticipantInMultiSignatureError, 03 throws nodeError
        it("should throw if failure to verify signatures in asset", async () => {
            multiSignatureTransaction.data.signatures![0] = multiSignatureTransaction.data.signatures![0].replace(
                "00",
                "02",
            );
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(
                Error,
                // InvalidMultiSignatureError,
            );
        });

        it("should throw if the number of keys is less than minimum", async () => {
            senderWallet.forgetAttribute("multiSignature");

            handler.verifySignatures = jest.fn(() => true);
            crypto.TransactionManager.TransactionTools.Verifier.verifySecondSignature = jest.fn(() => true);

            multiSignatureTransaction.data.asset!.multiSignature!.publicKeys.splice(0, 2);
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(MultiSignatureMinimumKeysError);
        });

        it("should throw if the number of keys does not equal the signature count", async () => {
            senderWallet.forgetAttribute("multiSignature");

            handler.verifySignatures = jest.fn(() => true);
            crypto.TransactionManager.TransactionTools.Verifier.verifySecondSignature = jest.fn(() => true);

            multiSignatureTransaction.data.signatures!.splice(0, 2);
            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(MultiSignatureKeyCountMismatchError);
        });

        it("should throw if the same participant provides multiple signatures", async () => {
            const passphrases = ["secret1", "secret2", "secret3"];
            const participants = [
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]),
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
                crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[2]),
            ];

            const participantWallet = walletRepository.findByPublicKey(participants[0]);
            participantWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(1e8 * 100);

            multiSignatureTransaction = crypto.TransactionManager.BuilderFactory.multiSignature()
                .multiSignatureAsset({
                    publicKeys: participants,
                    min: 2,
                })
                .senderPublicKey(crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[0]))
                .nonce("1")
                .recipientId(recipientWallet.publicKey!)
                .multiSign(passphrases[0], 0)
                .multiSign(passphrases[1], 1)
                .multiSign(passphrases[2], 2)
                .sign(passphrases[0])
                .build();

            const multiSigWallet = walletRepository.findByPublicKey(
                crypto.CryptoManager.Identities.PublicKey.fromMultiSignatureAsset(
                    multiSignatureTransaction.data.asset!.multiSignature!,
                ),
            );

            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, participantWallet, walletRepository),
            ).toResolve();

            expect(multiSigWallet.hasMultiSignature()).toBeFalse();

            await handler.apply(multiSignatureTransaction, walletRepository);

            expect(multiSigWallet.hasMultiSignature()).toBeTrue();

            multiSigWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(1e8 * 100);

            const transferBuilder = factoryBuilder
                .get("Transfer")
                .withOptions({
                    amount: 10000000,
                    senderPublicKey: senderWallet.publicKey,
                    recipientId: multiSigWallet.address,
                })
                .make()
                // @ts-ignore
                .sign(passphrases[0])
                .nonce("1");

            // Different valid signatures of same payload and private key
            const signatures = [
                "774b430573285f09bd8e61bf04582b06ef55ee0e454cd0f86b396c47ea1269f514748e8fb2315f2f0ce4bb81777ae673d8cab44a54a773f3c20cb0c754fd67ed",
                "dfb75f880769c3ae27640e1214a7ece017ddd684980e2276c908fe7806c1d6e8ceac47bb53004d84bdac22cdcb482445c056256a6cd417c5dc973d8266164ec0",
                "64233bb62b694eb0004e1d5d497b0b0e6d977b3a0e2403a9abf59502aef65c36c6e0eed599d314d4f55a03fc0dc48f0c9c9fd4bfab65e5ac8fe2a5c5ac3ed2ae",
            ];

            // All verify with participants[0]
            transferBuilder.data.signatures = [];
            for (const signature of signatures) {
                transferBuilder.data.signatures.push(
                    `${crypto.CryptoManager.LibraryManager.Crypto.numberToHex(0)}${signature}`,
                );
            }
            //
            expect(() => transferBuilder.build()).toThrow(Errors.DuplicateParticipantInMultiSignatureError);
            expect(() => handler.verifySignatures(multiSigWallet, transferBuilder.getStruct())).toThrow(
                Errors.DuplicateParticipantInMultiSignatureError,
            );
        });

        it("should throw if wallet has insufficient funds", async () => {
            senderWallet.forgetAttribute("multiSignature");
            senderWallet.balance = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            await expect(
                handler.throwIfCannotBeApplied(multiSignatureTransaction, senderWallet, walletRepository),
            ).rejects.toThrow(InsufficientBalanceError);
        });
    });

    describe("throwIfCannotEnterPool", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).toResolve();
        });

        it("should throw if transaction by sender already in pool", async () => {
            await app.get<Mempool>(Identifiers.TransactionPoolMempool).addTransaction(multiSignatureTransaction);

            await expect(handler.throwIfCannotEnterPool(multiSignatureTransaction)).rejects.toThrow(
                Contracts.TransactionPool.PoolError,
            );
        });
    });

    describe("apply", () => {
        it("should be ok", async () => {
            recipientWallet.forgetAttribute("multiSignature");

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.hasAttribute("multiSignature")).toBeFalse();

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(100390000000),
            );
            expect(recipientWallet.balance).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO);

            await handler.apply(multiSignatureTransaction, walletRepository);

            expect(senderWallet.balance).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(98390000000),
            );
            expect(recipientWallet.balance).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO);

            expect(senderWallet.hasAttribute("multiSignature")).toBeFalse();
            expect(recipientWallet.getAttribute("multiSignature")).toEqual(
                multiSignatureTransaction.data.asset!.multiSignature,
            );
        });
    });

    describe("revert", () => {
        it("should be ok", async () => {
            senderWallet.nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(1);

            await handler.revert(multiSignatureTransaction, walletRepository);

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.hasMultiSignature()).toBeFalse();
            expect(recipientWallet.hasMultiSignature()).toBeFalse();
        });
    });
});
