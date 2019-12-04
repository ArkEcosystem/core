import "jest-extended";

import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { Delegate } from "../../../../packages/core-forger/src/delegate";
import { Block, BlockFactory } from "../../../../packages/crypto/src/blocks";
import { Slots } from "../../../../packages/crypto/src/crypto";
import { IBlock } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import * as networks from "../../../../packages/crypto/src/networks";
import { testnet } from "../../../../packages/crypto/src/networks";
import { NetworkName } from "../../../../packages/crypto/src/types";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { dummyBlock, dummyBlock2 } from "../fixtures/block";

const { outlookTable } = configManager.getPreset("mainnet").exceptions;

beforeEach(() => configManager.setFromPreset("devnet"));

describe("Block", () => {
    const data = {
        id: "187940162505562345",
        blockSignature:
            "3045022100a6605198e0f590c88798405bc76748d84e280d179bcefed2c993e70cded2a5dd022008c7f915b89fc4f3250fc4b481abb753c68f30ac351871c50bd6cfaf151370e8",
        generatorPublicKey: "024c8247388a02ecd1de2a3e3fd5b7c61ecc2797fa3776599d558333ef1802d231",
        height: 10,
        numberOfTransactions: 0,
        payloadHash: "578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23",
        payloadLength: 1,
        previousBlock: "12123",
        timestamp: 111150,
        reward: Utils.BigNumber.ONE,
        totalAmount: Utils.BigNumber.make(10),
        totalFee: Utils.BigNumber.ONE,
        transactions: [],
        version: 6,
    };

    describe("constructor", () => {
        it("should store the data", () => {
            const block = BlockFactory.fromData(dummyBlock);

            expect(block.data.blockSignature).toBe(dummyBlock.blockSignature);
            expect(block.data.generatorPublicKey).toBe(dummyBlock.generatorPublicKey);
            expect(block.data.height).toBe(dummyBlock.height);
            expect(block.data.numberOfTransactions).toBe(dummyBlock.numberOfTransactions);
            expect(block.data.payloadLength).toBe(dummyBlock.payloadLength);
            expect(block.data.reward).toEqual(dummyBlock.reward);
            expect(block.data.timestamp).toBe(dummyBlock.timestamp);
            expect(block.data.totalFee).toEqual(dummyBlock.totalFee);
            expect(block.data.version).toBe(dummyBlock.version);
        });

        it("should verify the block", () => {
            const block = BlockFactory.fromData(dummyBlock);

            expect(block.verification.verified).toBeTrue();
        });

        it("should fail to verify the block ", () => {
            const block = BlockFactory.fromData(data);

            expect(block.verification.verified).toBeFalse();
        });

        it("should fail to verify a block with an invalid previous block", () => {
            const previousBlockBackup = dummyBlock.previousBlock;
            dummyBlock.previousBlock = "0000000000000000000";
            const block = BlockFactory.fromData(dummyBlock);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain("Failed to verify block signature");

            dummyBlock.previousBlock = previousBlockBackup;
        });

        it("should fail to verify a block with incorrect timestamp", () => {
            jest.spyOn(Slots, "getSlotNumber").mockImplementation(timestamp => (timestamp ? 2 : 0));
            const block = BlockFactory.fromData(dummyBlock);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain("Invalid block timestamp");

            jest.restoreAllMocks();
        });

        it("should fail to verify a block with too much transactions", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 2,
                },
                reward: Utils.BigNumber.make(0),
            };
            const transactions = TransactionFactory.transfer("DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY", 10)
                .withNetwork("devnet")
                .withPassphrase("super cool passphrase")
                .create(210);

            const block: IBlock = delegate.forge(transactions, optionsDefault);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain("Transactions length is too high");
        });

        it("should fail to verify a block with duplicate transactions", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 2,
                },
                reward: Utils.BigNumber.make(0),
            };
            const transactions = TransactionFactory.transfer("DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY", 10)
                .withNetwork("devnet")
                .withPassphrase("super cool passphrase")
                .create();

            const block: IBlock = delegate.forge([transactions[0], transactions[0]], optionsDefault);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain(`Encountered duplicate transaction: ${transactions[0].id}`);
        });

        it("should fail to verify a block with too large payload", () => {
            let block = BlockFactory.fromData(dummyBlock);

            jest.spyOn(configManager, "getMilestone").mockImplementation(height => ({
                block: {
                    version: 0,
                    maxTransactions: 200,
                    maxPayload: Buffer.from(block.serialized, "hex").byteLength - 1,
                },
                reward: 200000000,
                vendorFieldLength: 64,
            }));
            let verification = block.verify();

            expect(verification.verified).toBeFalse();
            expect(verification.errors[0]).toContain("Payload is too large");

            jest.spyOn(configManager, "getMilestone").mockImplementation(height => ({
                block: {
                    version: 0,
                    maxTransactions: 200,
                    maxPayload: Buffer.from(block.serialized, "hex").byteLength,
                },
                reward: 200000000,
                vendorFieldLength: 64,
            }));
            block = BlockFactory.fromData(dummyBlock);
            verification = block.verify();

            expect(verification.verified).toBeTrue();
            expect(verification.errors).toBeEmpty();

            jest.restoreAllMocks();
        });

        it("should verify a block with expiring transactions", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 100,
                },
                reward: Utils.BigNumber.make(0),
            };
            const transactions = TransactionFactory.transfer("DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY", 10)
                .withNetwork("devnet")
                .withTimestamp(optionsDefault.timestamp)
                .withPassphrase("super cool passphrase")
                .create();

            transactions[0].expiration = 102;

            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeTrue();
        });

        it("should fail to verify a block with expired transactions", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 100,
                },
                reward: Utils.BigNumber.make(0),
            };
            const transactions = TransactionFactory.transfer("ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38", 10)
                .withNetwork("testnet")
                .withVersion(2)
                .withExpiration(52)
                .withPassphrase("super cool passphrase")
                .create();

            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain(`Encountered expired transaction: ${transactions[0].id}`);
        });

        it("should fail to verify a block with expired transaction timestamp", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 100,
                },
                reward: Utils.BigNumber.make(0),
            };

            const transactions = TransactionFactory.transfer("ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38", 1)
                .withNetwork("testnet")
                .withVersion(1)
                .withTimestamp(optionsDefault.timestamp - 21601)
                .withPassphrase("super cool passphrase")
                .create();

            Managers.configManager.getMilestone().aip11 = false;
            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain(`Encountered expired transaction: ${transactions[0].id}`);
            Managers.configManager.getMilestone().aip11 = true;
        });

        it("should verify a block with future transaction timestamp if within blocktime", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 100,
                },
                reward: Utils.BigNumber.make(0),
            };

            const transactions = TransactionFactory.transfer("ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38", 1)
                .withNetwork("testnet")
                .withVersion(1)
                .withTimestamp(
                    optionsDefault.timestamp +
                        3600 +
                        configManager.getMilestone(optionsDefault.previousBlock.height).blocktime,
                )
                .withPassphrase("super cool passphrase")
                .create();

            Managers.configManager.getMilestone().aip11 = false;
            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeTrue();
            Managers.configManager.getMilestone().aip11 = true;
        });

        it("should fail to verify a block with future transaction timestamp", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 100,
                },
                reward: Utils.BigNumber.make(0),
            };

            const transactions = TransactionFactory.transfer("ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38", 1)
                .withNetwork("testnet")
                .withVersion(1)
                .withTimestamp(
                    optionsDefault.timestamp +
                        3601 +
                        configManager.getMilestone(optionsDefault.previousBlock.height).blocktime,
                )
                .withPassphrase("super cool passphrase")
                .create();

            Managers.configManager.getMilestone().aip11 = false;
            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain(`Encountered future transaction: ${transactions[0].id}`);
            Managers.configManager.getMilestone().aip11 = true;
        });

        it("should accept block with future transaction timestamp if milestone is active", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "11111111",
                    idHex: "11111111",
                    height: 100,
                },
                reward: Utils.BigNumber.make(0),
            };

            const transactions = TransactionFactory.transfer("ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38", 1)
                .withNetwork("mainnet")
                .withVersion(1)
                .withTimestamp(
                    optionsDefault.timestamp +
                        3601 +
                        configManager.getMilestone(optionsDefault.previousBlock.height).blocktime,
                )
                .withPassphrase("super cool passphrase")
                .create();

            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeTrue();
            expect(block.verification.errors).toBeEmpty();
        });

        it("should reject block with future transaction timestamp if milestone is not active", () => {
            const delegate = new Delegate("super cool passphrase", testnet.network);
            const optionsDefault = {
                timestamp: 12345689,
                previousBlock: {
                    id: "c2fa2d400b4c823873d476f6e0c9e423cf925e9b48f1b5706c7e2771d4095538",
                    height: 8999999,
                },
                reward: Utils.BigNumber.make(0),
            };

            const transactions = TransactionFactory.transfer("ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38", 1)
                .withNetwork("mainnet")
                .withVersion(1)
                .withTimestamp(
                    optionsDefault.timestamp +
                        3601 +
                        configManager.getMilestone(optionsDefault.previousBlock.height).blocktime,
                )
                .withPassphrase("super cool passphrase")
                .create();

            const block: IBlock = delegate.forge(transactions, optionsDefault);
            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain(`Encountered future transaction: ${transactions[0].id}`);
        });

        it("should fail to verify a block if error is thrown", () => {
            const errorMessage = "Very very, very bad error";
            jest.spyOn(Slots, "getSlotNumber").mockImplementation(height => {
                throw errorMessage;
            });
            const block = BlockFactory.fromData(dummyBlock);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toEqual([errorMessage]);

            jest.restoreAllMocks();
        });

        it("should construct the block (header only)", () => {
            const block = BlockFactory.fromHex(dummyBlock2.serialized);
            const actual = block.toJson();

            expect(actual.version).toBe(dummyBlock2.data.version);
            expect(actual.timestamp).toBe(dummyBlock2.data.timestamp);
            expect(actual.height).toBe(dummyBlock2.data.height);
            expect(actual.previousBlock).toBe(dummyBlock2.data.previousBlock);
            expect(actual.numberOfTransactions).toBe(dummyBlock2.data.numberOfTransactions);
            expect(actual.totalAmount).toBe(dummyBlock2.data.totalAmount.toFixed());
            expect(actual.totalFee).toBe(dummyBlock2.data.totalFee.toFixed());
            expect(actual.reward).toBe(dummyBlock2.data.reward.toFixed());
            expect(actual.payloadLength).toBe(dummyBlock2.data.payloadLength);
            expect(actual.payloadHash).toBe(dummyBlock2.data.payloadHash);
            expect(actual.generatorPublicKey).toBe(dummyBlock2.data.generatorPublicKey);
            expect(actual.blockSignature).toBe(dummyBlock2.data.blockSignature);
            expect(actual.transactions).toBeEmpty();
        });

        it("should construct the block (full)", () => {
            const block = BlockFactory.fromHex(dummyBlock2.serializedFull);
            const actual = block.toJson();

            expect(actual.version).toBe(dummyBlock2.data.version);
            expect(actual.timestamp).toBe(dummyBlock2.data.timestamp);
            expect(actual.height).toBe(dummyBlock2.data.height);
            expect(actual.previousBlock).toBe(dummyBlock2.data.previousBlock);
            expect(actual.numberOfTransactions).toBe(dummyBlock2.data.numberOfTransactions);
            expect(actual.totalAmount).toBe(dummyBlock2.data.totalAmount.toFixed());
            expect(actual.totalFee).toBe(dummyBlock2.data.totalFee.toFixed());
            expect(actual.reward).toBe(dummyBlock2.data.reward.toFixed());
            expect(actual.payloadLength).toBe(dummyBlock2.data.payloadLength);
            expect(actual.payloadHash).toBe(dummyBlock2.data.payloadHash);
            expect(actual.generatorPublicKey).toBe(dummyBlock2.data.generatorPublicKey);
            expect(actual.blockSignature).toBe(dummyBlock2.data.blockSignature);
            expect(actual.transactions).toHaveLength(7);
        });
    });

    describe("getHeader", () => {
        it("returns the block data without the transactions", () => {
            // Ignore the verification for testing purposes
            jest.spyOn(Block.prototype as any, "verify").mockImplementation(() => ({ verified: true }));

            const data2 = { ...data };
            const header = BlockFactory.fromData(data2).getHeader();
            const bignumProperties = ["reward", "totalAmount", "totalFee"];

            for (const key of Object.keys(data)) {
                if (key !== "transactions") {
                    if (bignumProperties.includes(key)) {
                        expect(header[key]).toEqual(Utils.BigNumber.make(data2[key]));
                    } else {
                        expect(header[key]).toEqual(data2[key]);
                    }
                }
            }

            expect(header).not.toHaveProperty("transactions");

            jest.restoreAllMocks();
        });
    });

    describe("serialize", () => {
        const serialize = (object, includeSignature?: any) => {
            const serialized = Block.serialize(object, includeSignature);
            const buffer = new ByteBuffer(1024, true);
            buffer.append(serialized);
            buffer.flip();
            return buffer;
        };

        it("version is serialized as a TODO", () => {
            expect(serialize(data).readUint32(0)).toEqual(data.version);
        });

        it("timestamp is serialized as a UInt32", () => {
            expect(serialize(data).readUint32(4)).toEqual(data.timestamp);
        });

        it("height is serialized as a UInt32", () => {
            expect(serialize(data).readUint32(8)).toEqual(data.height);
        });

        describe("if `previousBlock` exists", () => {
            it("is serialized as hexadecimal", () => {
                const dataWithPreviousBlock: any = Object.assign({}, data, {
                    previousBlock: "1234",
                });
                expect(
                    serialize(dataWithPreviousBlock)
                        .slice(12, 20)
                        .toString("hex"),
                ).toEqual(dataWithPreviousBlock.previousBlockHex);
            });
        });

        describe("if `previousBlock` does not exist", () => {
            it("8 bytes are added, as padding", () => {
                const dataWithoutPreviousBlock = Object.assign({}, data);
                delete dataWithoutPreviousBlock.previousBlock;
                expect(
                    serialize(dataWithoutPreviousBlock)
                        .slice(12, 20)
                        .toString("hex"),
                ).toEqual("0000000000000000");
            });
        });

        it("number of transactions is serialized as a UInt32", () => {
            expect(serialize(data).readUint32(20)).toEqual(data.numberOfTransactions);
        });

        it("`totalAmount` of transactions is serialized as a UInt64", () => {
            expect(
                serialize(data)
                    .readUint64(24)
                    .toNumber(),
            ).toEqual(+data.totalAmount);
        });

        it("`totalFee` of transactions is serialized as a UInt64", () => {
            expect(
                serialize(data)
                    .readUint64(32)
                    .toNumber(),
            ).toEqual(+data.totalFee);
        });

        it("`reward` of transactions is serialized as a UInt64", () => {
            expect(
                serialize(data)
                    .readUint64(40)
                    .toNumber(),
            ).toEqual(+data.reward);
        });

        it("`payloadLength` of transactions is serialized as a UInt32", () => {
            expect(serialize(data).readUint32(48)).toEqual(data.payloadLength);
        });

        it("`payloadHash` of transactions is appended, using 32 bytes, as hexadecimal", () => {
            expect(
                serialize(data)
                    .slice(52, 52 + 32)
                    .toString("hex"),
            ).toEqual(data.payloadHash);
        });

        it("`generatorPublicKey` of transactions is appended, using 33 bytes, as hexadecimal", () => {
            expect(
                serialize(data)
                    .slice(84, 84 + 33)
                    .toString("hex"),
            ).toEqual(data.generatorPublicKey);
        });

        describe("if the `blockSignature` is not included", () => {
            it("is not serialized", () => {
                const data2 = { ...data };
                delete data2.blockSignature;
                expect(serialize(data2).limit).toEqual(117);
            });

            it("is not serialized, even when the `includeSignature` parameter is true", () => {
                const data2 = { ...data };
                delete data2.blockSignature;
                expect(serialize(data2, true).limit).toEqual(117);
            });
        });

        describe("if the `blockSignature` is included", () => {
            it("is serialized", () => {
                expect(
                    serialize(data)
                        .slice(117, 188)
                        .toString("hex"),
                ).toEqual(data.blockSignature);
            });

            it("is serialized unless the `includeSignature` parameter is false", () => {
                expect(serialize(data, false).limit).toEqual(117);
            });
        });
    });

    describe("serializeWithTransactions", () => {
        describe("genesis block", () => {
            it.each([["mainnet", 468048], ["devnet", 14492], ["testnet", 46488]])(
                "%s",
                (network: NetworkName, length: number) => {
                    configManager.setFromPreset(network);
                    configManager.getMilestone().aip11 = false;

                    const block: Interfaces.IBlock = BlockFactory.fromJson(networks[network].genesisBlock);

                    expect(block.serialized).toHaveLength(length);
                    expect(block.verifySignature()).toBeTrue();
                    configManager.getMilestone().aip11 = network === "testnet";
                },
            );
        });

        it("should validate hash", () => {
            // @ts-ignore
            const s = Block.serializeWithTransactions(dummyBlock).toString("hex");
            const serialized =
                "00000000006fb50300db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e0000000de56269cae3ab156f6979b94a04c30b82ed7d6f9a97d162583c98215c18c65db03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3730450221008c59bd2379061ad3539b73284fc0bbb57dbc97efd54f55010ba3f198c04dde7402202e482126b3084c6313c1378d686df92a3e2ef5581323de11e74fe07eeab339f3990000009a0000009a0000009a000000990000009a00000099000000ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000006d7c4d00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530440220714c2627f0e9c3bd6bf13b8b4faa5ec2d677694c27f580e2f9e3875bde9bc36f02201c33faacab9eafd799d9ceecaa153e3b87b4cd04535195261fd366e552652549ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3780969800000000000000f1536500000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100e6039f810684515c0d6b31039040a76c98f3624b6454cb156a0a2137e5f8dba7022001ada19bcca5798e1c7cc8cc39bab5d4019525e3d72a42bd2c4129352b8ead87ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000002f685900000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100c2b5ef772b36e468e95ec2e457bfaba7bad0e13b3faf57e229ff5d67a0e017c902202339664595ea5c70ce20e4dd182532f7fa385d86575b0476ff3eda9f9785e1e9ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3780969800000000000000105e5f00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530450221009ceb56688705e6b12000bde726ca123d84982231d7434f059612ff5f987409c602200d908667877c902e7ba35024951046b883e0bce9103d4717928d94ecc958884aff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000008c864700000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530440220464beac6d49943ad8afaac4fdc863c9cd7cf3a84f9938c1d7269ed522298f11a02203581bf180de1966f86d914afeb005e1e818c9213514f96a34e1391c2a08514faff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3780969800000000000000d2496b00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100c7b40d7134d909762d18d6bfb7ac1c32be0ee8c047020131f499faea70ca0b2b0220117c0cf026f571f5a85e3ae800a6fd595185076ff38e64c7a4bd14f34e1d4dd1ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000004e725300000000000000001e46550551e12d2531ea9d2968696b75f68ae7f295304402206a4a8e4e6918fbc15728653b117f51db716aeb04e5ee1de047f80b0476ee4efb02200f486dfaf0def3f3e8636d46ee75a2c07de9714ce4283a25fde9b6218b5e7923";
            const block1 = BlockFactory.fromData(dummyBlock);
            const block2 = BlockFactory.fromData(Block.deserialize(serialized));

            expect(s).toEqual(serialized);
            expect(block1.verification.verified).toEqual(true);
            expect(block2.verification.verified).toEqual(true);
        });
    });

    it("should reorder correctly transactions in deserialization", () => {
        configManager.setFromPreset("mainnet");

        const issue = {
            version: 0,
            timestamp: 25029544,
            height: 3084276,
            previousBlockHex: "63b315f3663e4299",
            previousBlock: "7184109965722665625",
            numberOfTransactions: 2,
            totalAmount: Utils.BigNumber.make(0),
            totalFee: Utils.BigNumber.make(600000000),
            reward: Utils.BigNumber.make(200000000),
            payloadLength: 64,
            payloadHash: "c2fa2d400b4c823873d476f6e0c9e423cf925e9b48f1b5706c7e2771d4095538",
            generatorPublicKey: "02fa6902e91e127d6d3410f6abc271a79ae24029079caa0db5819757e3c1c1c5a4",
            blockSignature:
                "30440220543f71d6f6445b703459b4f91d2c6f2446cbe6669e9c9008b1c77cc57073af2402206036fee3b434ffd5a31a579dd5b514a1c6384962291fda27b2463de903422834",
            id: "11773170219525190460",
            transactions: [
                {
                    id: "7a1a43098cd253db395514220f69e3b99afaabb2bfcf5ecfa3b99727b367344b",
                    network: 0x17,
                    type: 1,
                    timestamp: 25028279,
                    fee: Utils.BigNumber.make(500000000),
                    amount: Utils.BigNumber.make(0),
                    senderPublicKey: "02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd",
                    signature:
                        "3044022071f4f5281ba7be76e43df4ea9e74f820da761e1f9f3b168b3a6e42c55ccf343a02203629d94845709e31be20943e2cd26637f0d8ccfb4a59764d45c161a942def069",
                    asset: {
                        signature: {
                            publicKey: "02135e2ebd97d1f1ab5141b4269defc6e5650848062c40baaf869d72571526e6c6",
                        },
                    },
                },
                {
                    type: 3,
                    network: 0x17,
                    timestamp: 25028325,
                    senderPublicKey: "02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd",
                    fee: Utils.BigNumber.make(100000000),
                    amount: Utils.BigNumber.make(0),
                    asset: {
                        votes: ["+020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92"],
                    },
                    signature:
                        "3045022100be28bdd7dc7117de903eccf97e3afbe87e1a32ee25b0b9bf814b35c6773ed51802202c8d62e708aa7afc08dbfcfd4640d105fe97337fb6145a8d916f2ce11c920255",
                    recipientId: "ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38",
                    id: "bace38ea544678f951cdd4abc269be24b4f5bab925ff6d5b480657952eb5aa65",
                },
            ],
        };

        const block = BlockFactory.fromData(issue);
        expect(block.data.id).toBe(issue.id);
        expect(block.transactions[0].id).toBe(issue.transactions[1].id);

        configManager.setFromPreset("devnet");
    });

    describe("v1 fix", () => {
        const table = {
            "5139199631254983076": "1000099631254983076",
            "4683900276587456793": "1000000276587456793",
            "4719273207090574361": "1000073207090574361",
            "10008425497949974873": "10000425497949974873",
            "3011426208694781338": "1000026208694781338",
            "122506651077645039": "100006651077645039",
            "5720847785115142568": "1000047785115142568",
            "7018402152859193732": "1000002152859193732",
            "12530635932931954947": "10000635932931954947",
            "7061061305098280027": "1000061305098280027",
            "3983271186026110297": "1000071186026110297",
            "3546732630357730082": "1000032630357730082",
            "14024378732446299587": "10000378732446299587",
            "5160516564770509401": "1000016564770509401",
            "241883250703033792": "100003250703033792",
            "18238049267092652511": "10000049267092652511",
            "3824223895435898486": "1000023895435898486",
            "4888561739037785996": "1000061739037785996",
            "1256478353465481084": "1000078353465481084",
            "12598210368652133913": "10000210368652133913",
            "17559226088420912749": "10000226088420912749",
            "13894975866600060289": "10000975866600060289",
            "11710672157782824154": "10000672157782824154",
            "5509880884401609373": "1000080884401609373",
            "11486353335769396593": "10000353335769396593",
            "10147280738049458646": "10000280738049458646",
            "5684621525438367021": "1000021525438367021",
            "719490120693255848": "100000120693255848",
            "7154018532147250826": "1000018532147250826",
            "38016207884795383": "10000207884795383",
            "8324387831264270399": "1000087831264270399",
            "10123661368384267251": "10000661368384267251",
            "2222163236406460530": "1000063236406460530",
            "5059382813585250340": "1000082813585250340",
            "7091362542116598855": "1000062542116598855",
            "8225244493039935740": "1000044493039935740",
        };

        describe("outlook table", () => {
            it("should have expected values in the outlook table", () => {
                expect(outlookTable).toEqual(table);
            });
        });

        describe("apply v1 fix", () => {
            it("should not process a common block", () => {
                const mock = {
                    id: "187940162505562345",
                    blockSignature:
                        "3045022100a6605198e0f590c88798405bc76748d84e280d179bcefed2c993e70cded2a5dd022008c7f915b89fc4f3250fc4b481abb753c68f30ac351871c50bd6cfaf151370e8",
                    generatorPublicKey: "024c8247388a02ecd1de2a3e3fd5b7c61ecc2797fa3776599d558333ef1802d231",
                    height: 10,
                    numberOfTransactions: 0,
                    payloadHash: "578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23",
                    payloadLength: 1,
                    previousBlock: "12123",
                    timestamp: 111150,
                    reward: Utils.BigNumber.ONE,
                    totalAmount: Utils.BigNumber.make(10),
                    totalFee: Utils.BigNumber.ONE,
                    transactions: [],
                    version: 6,
                };
                const blk = BlockFactory.fromData(mock);
                expect(blk.data.id).toBe(mock.id);
            });

            it("should process a matching id", () => {
                const mock2 = {
                    id: "8225244493039935740",
                    blockSignature:
                        "3045022100a6605198e0f590c88798405bc76748d84e280d179bcefed2c993e70cded2a5dd022008c7f915b89fc4f3250fc4b481abb753c68f30ac351871c50bd6cfaf151370e8",
                    generatorPublicKey: "024c8247388a02ecd1de2a3e3fd5b7c61ecc2797fa3776599d558333ef1802d231",
                    height: 10,
                    numberOfTransactions: 0,
                    payloadHash: "578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23",
                    payloadLength: 1,
                    previousBlock: "12123",
                    timestamp: 111150,
                    reward: Utils.BigNumber.ONE,
                    totalAmount: Utils.BigNumber.make(10),
                    totalFee: Utils.BigNumber.ONE,
                    transactions: [],
                    version: 6,
                };
                const blk2 = BlockFactory.fromData(mock2);
                expect(blk2.data.id).not.toBe(mock2.id);
            });
        });
    });
});
