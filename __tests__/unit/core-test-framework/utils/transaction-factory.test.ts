import "jest-extended";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";
import { Sandbox } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Identities, Managers, Utils } from "@packages/crypto";
import { Generators } from "@packages/core-test-framework/src";
import {
    passphrasePairsAsset,
    bridgechainRegistrationAsset,
    bridgechainUpdateAsset,
    businessRegistrationAsset,
    businessUpdateAsset,
    htlcClaimAsset,
    htlcLockAsset,
    htlcRefundAsset,
} from "./__fixtures__/assets";

let sandbox: Sandbox;
let transactionFactory: TransactionFactory;

beforeEach(() => {
    let config = Generators.generateCryptoConfigRaw();
    Managers.configManager.setConfig(config);

    sandbox = new Sandbox();

    transactionFactory = TransactionFactory.initialize(sandbox.app);
});

afterEach(() => {
    jest.resetAllMocks();
});


describe("TransactionFactory", () => {
    describe("transfer", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer(Identities.Address.fromPassphrase(passphrases[0]), 5, "dummy");

            expect(entity).toBeInstanceOf(TransactionFactory);
        });

        it("should return transaction factory - with default parameters", async () => {
            let entity = transactionFactory.transfer();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("secondSignature", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.secondSignature(passphrases[0]);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });

        it("should return transaction factory - with default parameters", async () => {
            let entity = transactionFactory.secondSignature();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("delegateRegistration", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.delegateRegistration("username");

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("delegateResignation", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.delegateResignation();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("vote", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.vote(Identities.PublicKey.fromPassphrase(passphrases[0]));

            expect(entity).toBeInstanceOf(TransactionFactory);
        });

        it("should return transaction factory - with default parameters", async () => {
            let entity = transactionFactory.vote();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("unvote", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.unvote(Identities.PublicKey.fromPassphrase(passphrases[0]));

            expect(entity).toBeInstanceOf(TransactionFactory);
        });

        it("should return transaction factory - with default parameters", async () => {
            let entity = transactionFactory.unvote();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("multiSignature", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.multiSignature([passphrases[0], passphrases[1], passphrases[2]], 2);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });

        it("should return transaction factory - with default parameters", async () => {
            let entity = transactionFactory.multiSignature();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("ipfs", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.ipfs("dummy_id");

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("htlcLock", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.htlcLock(htlcLockAsset, Identities.Address.fromPassphrase(passphrases[0]), 5);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });

        it("should return transaction factory - with default parameters", async () => {
            let entity = transactionFactory.htlcLock(htlcLockAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("htlcClaim", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.htlcClaim(htlcClaimAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("htlcRefund", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.htlcRefund(htlcRefundAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("multiPayment", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.multiPayment([
                { recipientId: Identities.Address.fromPassphrase(passphrases[0]), amount: "10" },
                { recipientId: Identities.Address.fromPassphrase(passphrases[1]), amount: "20" },
                { recipientId: Identities.Address.fromPassphrase(passphrases[2]), amount: "30" },
            ]);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("businessRegistration", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.businessRegistration(businessRegistrationAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("businessResignation", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.businessResignation();

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("businessUpdate", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.businessUpdate(businessUpdateAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("bridgechainRegistration", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.bridgechainRegistration(bridgechainRegistrationAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("bridgechainResignation", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.bridgechainResignation("127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935");

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("bridgechainUpdate", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.bridgechainUpdate(bridgechainUpdateAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withFee", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withFee(5);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withTimestamp", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withTimestamp(5);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withNetwork", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withNetwork("testnet");

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withNetworkConfig", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withNetworkConfig(Generators.generateCryptoConfigRaw());

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withHeight", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withHeight(5);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withSenderPublicKey", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withSenderPublicKey(Identities.PublicKey.fromPassphrase(passphrases[0]));

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withNonce", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withNonce(Utils.BigNumber.make(5));

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withExpiration", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withExpiration(5);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withVersion", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withVersion(2);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withPassphrase", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withPassphrase(passphrases[0]);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withSecondPassphrase", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withSecondPassphrase(passphrases[0]);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withPassphraseList", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withPassphraseList([passphrases[0], passphrases[1]]);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withPassphrasePair", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withPassphrasePair(passphrasePairsAsset[0]);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("withPassphrasePairs", () => {
        it("should return transaction factory", async () => {
            let entity = transactionFactory.transfer().withPassphrasePairs(passphrasePairsAsset);

            expect(entity).toBeInstanceOf(TransactionFactory);
        });
    });

    describe("create", () => {
        it("should return transactions - with default parameters", async () => {
            let entity = transactionFactory.transfer().withVersion(2).create(5);

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((transaction) => {
                expect(transaction.id).toBeDefined();
                expect(transaction.signature).toBeDefined();
                expect(transaction.type).toBeDefined();
                expect(transaction.typeGroup).toBeDefined();
                expect(transaction.fee).toBeDefined();
                expect(transaction.senderPublicKey).toBeDefined();
                expect(transaction.nonce).toBeDefined();
                expect(transaction.amount).toBeDefined();
                expect(transaction.recipientId).toBeDefined();
                expect(transaction.vendorField).toBeDefined();
            })
        });

        it("should return transactions - with default parameters", async () => {
            let entity = transactionFactory.transfer().withVersion(2).create();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((transaction) => {
                expect(transaction.id).toBeDefined();
                expect(transaction.signature).toBeDefined();
                expect(transaction.type).toBeDefined();
                expect(transaction.typeGroup).toBeDefined();
                expect(transaction.fee).toBeDefined();
                expect(transaction.senderPublicKey).toBeDefined();
                expect(transaction.nonce).toBeDefined();
                expect(transaction.amount).toBeDefined();
                expect(transaction.recipientId).toBeDefined();
                expect(transaction.vendorField).toBeDefined();
            })
        });
    });

    describe("createOne", () => {
        it("should return transaction", async () => {
            let transaction = transactionFactory.transfer().withVersion(2).createOne();

            expect(transaction.id).toBeDefined();
            expect(transaction.signature).toBeDefined();
            expect(transaction.type).toBeDefined();
            expect(transaction.typeGroup).toBeDefined();
            expect(transaction.fee).toBeDefined();
            expect(transaction.senderPublicKey).toBeDefined();
            expect(transaction.nonce).toBeDefined();
            expect(transaction.amount).toBeDefined();
            expect(transaction.recipientId).toBeDefined();
            expect(transaction.vendorField).toBeDefined();
        });
    });

    describe("build", () => {
        it("should return transactions", async () => {
            let entity = transactionFactory.transfer().withVersion(2).build(5);

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
                expect(item.data.recipientId).toBeDefined();
                expect(item.data.vendorField).toBeDefined();
            })
        });

        it("should return transactions - with default parameters", async () => {
            let entity = transactionFactory.transfer().withVersion(2).build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
                expect(item.data.recipientId).toBeDefined();
                expect(item.data.vendorField).toBeDefined();
            })
        });

        it("should return transactions - with passphrase pairs", async () => {
            let entity = transactionFactory.transfer().withVersion(2).withPassphrasePairs(passphrasePairsAsset).build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
                expect(item.data.recipientId).toBeDefined();
                expect(item.data.vendorField).toBeDefined();
            })
        });

        it("should return transactions - without network config", async () => {

            let entity = transactionFactory.transfer()
                .withVersion(2)
                .withNetworkConfig(Generators.generateCryptoConfigRaw())
                .build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
                expect(item.data.recipientId).toBeDefined();
                expect(item.data.vendorField).toBeDefined();
            })
        });

        it("should return transactions - with parameters", async () => {
            let entity = transactionFactory.transfer()
                .withVersion(2)
                .withFee(5)
                .withTimestamp(5)
                .withExpiration(5)
                .build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
                expect(item.data.recipientId).toBeDefined();
                expect(item.data.vendorField).toBeDefined();
            })
        });

        it("should return transactions - delegate registration", async () => {
            let entity = transactionFactory.delegateRegistration()
                .withVersion(2)
                .build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
            })
        });

        it("should return transactions - multi signature", async () => {
            let entity = transactionFactory
                .multiSignature()
                .withPassphraseList([passphrases[0], passphrases[1], passphrases[2]])
                .withNetworkConfig(Generators.generateCryptoConfigRaw())
                .build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeDefined();
                expect(item.data.amount).toBeDefined();
                expect(item.data.signatures).toBeArray();
            })
        });

        it("should return transactions - with aip11 and verision", async () => {
            let entity = transactionFactory
                .transfer()
                .withVersion(1)
                .withNetworkConfig(Generators.generateCryptoConfigRaw())
                .build();

            expect(entity).toBeArray();
            expect(entity.length).toBeGreaterThan(0);

            entity.forEach((item) => {
                expect(item.data.id).toBeDefined();
                expect(item.data.signature).toBeDefined();
                expect(item.data.type).toBeDefined();
                expect(item.data.typeGroup).toBeDefined();
                expect(item.data.fee).toBeDefined();
                expect(item.data.senderPublicKey).toBeDefined();
                expect(item.data.nonce).toBeUndefined();
                expect(item.data.amount).toBeDefined();
            })
        });
    });
});
