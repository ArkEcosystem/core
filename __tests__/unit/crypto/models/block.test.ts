import "jest-extended";

import { generators } from "../../../utils";
const { generateTransfers } = generators;

import ByteBuffer from "bytebuffer";
import { configManager, NetworkName } from "../../../../packages/crypto/src";
import { slots } from "../../../../packages/crypto/src/crypto";
import { Block, Delegate } from "../../../../packages/crypto/src/models";
import { testnet } from "../../../../packages/crypto/src/networks";
import { Bignum } from "../../../../packages/crypto/src/utils";
import { dummyBlock, dummyBlock2 } from "../fixtures/block";

const { outlookTable } = configManager.getPreset("mainnet").exceptions;

describe("Models - Block", () => {
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
        reward: 1,
        timestamp: 111150,
        totalAmount: 10,
        totalFee: 1,
        transactions: [],
        version: 6,
    };

    describe("constructor", () => {
        it("should store the data", () => {
            const block = new Block(dummyBlock);

            expect(block.data.blockSignature).toBe(dummyBlock.blockSignature);
            expect(block.data.generatorPublicKey).toBe(dummyBlock.generatorPublicKey);
            expect(block.data.height).toBe(dummyBlock.height);
            expect(block.data.numberOfTransactions).toBe(dummyBlock.numberOfTransactions);
            expect(block.data.payloadLength).toBe(dummyBlock.payloadLength);
            expect((block.data.reward as Bignum).toFixed()).toBe(dummyBlock.reward);
            expect(block.data.timestamp).toBe(dummyBlock.timestamp);
            expect((block.data.totalFee as Bignum).toFixed()).toBe(dummyBlock.totalFee);
            expect(block.data.version).toBe(dummyBlock.version);
        });

        it("should verify the block", () => {
            const block = new Block(dummyBlock);

            expect(block.verification.verified).toBeTrue();
        });

        it("should fail to verify the block ", () => {
            const block = new Block(data);

            expect(block.verification.verified).toBeFalse();
        });

        it("should fail to verify a block with an invalid previous block", () => {
            const previousBlockBackup = dummyBlock.previousBlock;
            dummyBlock.previousBlock = "0000000000000000000";
            const block = new Block(dummyBlock);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain("Failed to verify block signature");

            dummyBlock.previousBlock = previousBlockBackup;
        });

        it("should fail to verify a block with incorrect timestamp", () => {
            jest.spyOn(slots, "getSlotNumber").mockImplementation(timestamp => (timestamp ? 2 : 0));
            const block = new Block(dummyBlock);

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
                reward: new Bignum(0),
            };
            const transactions = generateTransfers(
                "devnet",
                "super cool passphrase",
                "DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY",
                10,
                210,
                true,
            );

            const blockForged = delegate.forge(transactions, optionsDefault);

            const block = new Block(blockForged.toJson());

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
                reward: new Bignum(0),
            };
            const transactions = generateTransfers(
                "devnet",
                "super cool passphrase",
                "DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY",
                10,
                1,
                true,
            );

            const blockForged = delegate.forge([transactions[0], transactions[0]], optionsDefault);

            const block = new Block(blockForged.toJson());

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain(`Encountered duplicate transaction: ${transactions[0].id}`);
        });

        it("should fail to verify a block with too large payload", () => {
            jest.spyOn(configManager, "getMilestone").mockImplementation(height => ({
                block: {
                    version: 0,
                    maxTransactions: 200,
                    maxPayload: 0,
                },
                reward: 200000000,
                vendorFieldLength: 64,
            }));
            const block = new Block(dummyBlock);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toContain("Payload is too large");

            jest.restoreAllMocks();
        });

        it("should fail to verify a block if error is thrown", () => {
            const errorMessage = "Very very, very bad error";
            jest.spyOn(slots, "getSlotNumber").mockImplementation(height => {
                throw errorMessage;
            });
            const block = new Block(dummyBlock);

            expect(block.verification.verified).toBeFalse();
            expect(block.verification.errors).toEqual([errorMessage]);

            jest.restoreAllMocks();
        });

        it("should construct the block (header only)", () => {
            const block = new Block(dummyBlock2.serialized);
            const actual = block.toJson();

            expect(actual.version).toBe(dummyBlock2.data.version);
            expect(actual.timestamp).toBe(dummyBlock2.data.timestamp);
            expect(actual.height).toBe(dummyBlock2.data.height);
            expect(actual.previousBlock).toBe(dummyBlock2.data.previousBlock);
            expect(actual.numberOfTransactions).toBe(dummyBlock2.data.numberOfTransactions);
            expect(actual.totalAmount).toBe(+dummyBlock2.data.totalAmount);
            expect(actual.totalFee).toBe(+dummyBlock2.data.totalFee);
            expect(actual.reward).toBe(+dummyBlock2.data.reward);
            expect(actual.payloadLength).toBe(dummyBlock2.data.payloadLength);
            expect(actual.payloadHash).toBe(dummyBlock2.data.payloadHash);
            expect(actual.generatorPublicKey).toBe(dummyBlock2.data.generatorPublicKey);
            expect(actual.blockSignature).toBe(dummyBlock2.data.blockSignature);
            expect(actual.transactions).toBeEmpty();
        });

        it("should construct the block (full)", () => {
            const block = new Block(dummyBlock2.serializedFull);
            const actual = block.toJson();

            expect(actual.version).toBe(dummyBlock2.data.version);
            expect(actual.timestamp).toBe(dummyBlock2.data.timestamp);
            expect(actual.height).toBe(dummyBlock2.data.height);
            expect(actual.previousBlock).toBe(dummyBlock2.data.previousBlock);
            expect(actual.numberOfTransactions).toBe(dummyBlock2.data.numberOfTransactions);
            expect(actual.totalAmount).toBe(+dummyBlock2.data.totalAmount);
            expect(actual.totalFee).toBe(+dummyBlock2.data.totalFee);
            expect(actual.reward).toBe(+dummyBlock2.data.reward);
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
            const header = new Block(data2).getHeader();
            const bignumProperties = ["reward", "totalAmount", "totalFee"];

            Object.keys(data).forEach(key => {
                if (key !== "transactions") {
                    if (bignumProperties.includes(key)) {
                        expect(header[key]).toEqual(new Bignum(data2[key]));
                    } else {
                        expect(header[key]).toEqual(data2[key]);
                    }
                }
            });

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

    describe("getIdFromSerialized", () => {
        it("should get the id from serialized buffer", () => {
            const serialized = Block.serialize(data);

            expect(Block.getIdFromSerialized(serialized)).toBe(data.id);
        });
    });

    describe("serializeFull", () => {
        describe("genesis block", () => {
            describe.each([["mainnet", 468048], ["devnet", 14492], ["testnet", 46488]])(
                "%s",
                (network: NetworkName, length: number) => {
                    configManager.setFromPreset(network);
                    const genesis = require(`@arkecosystem/crypto/src/networks/${network}/genesisBlock.json`);
                    const serialized = Block.serializeFull(genesis).toString("hex");
                    const genesisBlock = new Block(Block.deserialize(serialized));
                    expect(serialized).toHaveLength(length);
                    expect(genesisBlock.verifySignature()).toBeTrue();
                },
            );

            configManager.setFromPreset("devnet");
        });

        describe("should validate hash", () => {
            // @ts-ignore
            const s = Block.serializeFull(dummyBlock).toString("hex");
            const serialized =
                "0000000078d07901593a22002b324b8b33a85802070000007c5c3b0000000000801d2c040000000000c2eb0b00000000e00000003784b953afcf936bdffd43fdf005b5732b49c1fc6b11e195c364c20b2eb06282020f5df4d2bc736d12ce43af5b1663885a893fade7ee5e62b3cc59315a63e6a3253045022100eee6c37b5e592e99811d588532726353592923f347c701d52912e6d583443e400220277ffe38ad31e216ba0907c4738fed19b2071246b150c72c0a52bae4477ebe29ff000000fe00000000010000ff000000ff000000ff000000ff000000ff011e0062d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874f07a080000000000000000001e40fad23d21da7a4fd4decb5c49726ea22f5e6bf6304402204f12469157b19edd06ba25fcad3d4a5ef5b057c23f9e02de4641e6f8eef0553e022010121ab282f83efe1043de9c16bbf2c6845a03684229a0d7c965ffb9abdfb97830450221008327862f0b9178d6665f7d6674978c5caf749649558d814244b1c66cdf945c40022015918134ef01fed3fe2a2efde3327917731344332724522c75c2799a14f78717ff011e0060d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874e67a080000000000000000001e79c579fb08f448879c22fe965906b4e3b88d02ed304402205f82feb8c5d1d79c565c2ff7badb93e4c9827b132d135dda11cb25427d4ef8ac02205ff136f970533c4ec4c7d0cd1ea7e02d7b62629b66c6c93265f608d7f2389727304402207e912031fcc700d8a55fbc415993302a0d8e6aea128397141b640b6dba52331702201fd1ad3984e42af44f548907add6cb7ad72ca0070c8cc1d8dc9bbda208c56bd9ff011e0064d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874fa7a080000000000000000001e84fee45dde2b11525afe192a2e991d014ff93a36304502210083216e6969e068770e6d2fe5c244881002309df84d20290ddf3f858967ed010202202a479b3da5080ea475d310ff13494654b42db75886a8808bd211b4bdb9146a7a3045022100e1dcab3406bbeb968146a4a391909ce41df9b71592a753b001e7c2ee1d382c5102202a74aeafd4a152ec61854636fbae829c41f1416c1e0637a0809408394973099fff011e0061d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874e67a080000000000000000001e1d69583ede5ee82d220e74bffb36bae2ce762dfb3045022100cd4fa9855227be11e17201419dacfbbd5d9946df8d6792a9488160025693821402207fb83969bad6a26959f437b5bb88e255b0a48eb04964d0c0d29f7ee94bd15e11304402205f50c2991a17743d17ffbb09159cadc35a3f848044261842879ccf5be9d81c5e022023bf21c32fb6e94494104f15f8d3a942ab120d0abd6fb4c93790b68e1b307a79ff011e0062d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874f07a080000000000000000001e56f9a37a859f4f84e93ce7593e809b15a524db2930450221009c792062e13399ac6756b2e9f137194d06e106360ac0f3e24e55c7249cee0b3602205dc1d9c76d0451d1cb5a2396783a13e6d2d790ccfd49291e3d0a78349f7ea0e830440220083ba8a9af49b8be6e93794d71ec43ffc96a158375810e5d9f2478e71655315b0220278402ecaa1d224dab9f0f3b28295bbaea339c85c7400edafdc49df87439fc64ff011e0063d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874f07a080000000000000000001e0232a083c16aba4362dddec1b3050ffdd6d43f2e3044022063c65263e42be02bd9831b375c1d76a88332f00ed0557ecc1e7d2375ca40070902206797b5932c0bad68444beb5a38daa7cadf536ee2144e0d9777b812284d14374e3045022100b04da6692f75d43229ffd8486c1517e8952d38b4c03dfac38b6b360190a5c33e0220776622e5f09f92a1258b4a011f22181c977b622b8d1bbb2f83b42f4126d00739ff011e0060d079010265c1f6b8c1966a90f3fed7bc32fd4f42238ab4938fdb2a4e7ddd01ae8b58b4c080969800000000001f476f6f736520566f746572202d205472756520426c6f636b20576569676874e67a080000000000000000001eccc4fce0dc95f9951ee40c09a7ae807746cf51403045022100d4513c3608c2072e38e7a0e3bb8daf2cd5f7cc6fec9a5570dccd1eda696c591902202ecbbf3c9d0757be7b23c8b1cc6481c51600d158756c47fcb6f4a7f4893e31c4304402201fed4858d0806dd32220960900a871dd2f60e1f623af75feef9b1034a9a0a46402205a29b27c63fcc3e1ee1e77ecbbf4dd6e7db09901e7a09b9fd490cd68d62392cb";
            const block1 = new Block(dummyBlock);
            const block2 = new Block(Block.deserialize(serialized));

            expect(s).toEqual(serialized);
            expect(block1.verification.verified).toEqual(true);
            expect(block2.verification.verified).toEqual(true);
        });
    });

    describe("should reorder correctly transactions in deserialization", () => {
        configManager.setFromPreset("mainnet");

        const issue = {
            version: 0,
            timestamp: 25029544,
            height: 3084276,
            previousBlockHex: "63b315f3663e4299",
            previousBlock: "7184109965722665625",
            numberOfTransactions: 2,
            totalAmount: 0,
            totalFee: 600000000,
            reward: 200000000,
            payloadLength: 64,
            payloadHash: "c2fa2d400b4c823873d476f6e0c9e423cf925e9b48f1b5706c7e2771d4095538",
            generatorPublicKey: "02fa6902e91e127d6d3410f6abc271a79ae24029079caa0db5819757e3c1c1c5a4",
            blockSignature:
                "30440220543f71d6f6445b703459b4f91d2c6f2446cbe6669e9c9008b1c77cc57073af2402206036fee3b434ffd5a31a579dd5b514a1c6384962291fda27b2463de903422834",
            id: "11773170219525190460",
            transactions: [
                {
                    type: 3,
                    network: 0x17,
                    timestamp: 25028325,
                    senderPublicKey: "02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd",
                    fee: 100000000,
                    amount: 0,
                    asset: {
                        votes: ["+020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92"],
                    },
                    signature:
                        "3045022100be28bdd7dc7117de903eccf97e3afbe87e1a32ee25b0b9bf814b35c6773ed51802202c8d62e708aa7afc08dbfcfd4640d105fe97337fb6145a8d916f2ce11c920255",
                    recipientId: "ANYiQJSPSoDT8U9Quh5vU8timD2RM7RS38",
                    id: "bace38ea544678f951cdd4abc269be24b4f5bab925ff6d5b480657952eb5aa65",
                },
                {
                    id: "7a1a43098cd253db395514220f69e3b99afaabb2bfcf5ecfa3b99727b367344b",
                    network: 0x17,
                    type: 1,
                    timestamp: 25028279,
                    fee: 500000000,
                    amount: 0,
                    senderPublicKey: "02aadc3e0993c1d3447db27741745eb9c2c6522cccf02fc8efe3bf2d49708243dd",
                    signature:
                        "3044022071f4f5281ba7be76e43df4ea9e74f820da761e1f9f3b168b3a6e42c55ccf343a02203629d94845709e31be20943e2cd26637f0d8ccfb4a59764d45c161a942def069",
                    asset: {
                        signature: {
                            publicKey: "02135e2ebd97d1f1ab5141b4269defc6e5650848062c40baaf869d72571526e6c6",
                        },
                    },
                },
            ],
        };

        const block = new Block(issue);
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
                    reward: 1,
                    timestamp: 111150,
                    totalAmount: 10,
                    totalFee: 1,
                    transactions: [],
                    version: 6,
                };
                const blk = new Block(mock);
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
                    reward: 1,
                    timestamp: 111150,
                    totalAmount: 10,
                    totalFee: 1,
                    transactions: [],
                    version: 6,
                };
                const blk2 = new Block(mock2);
                expect(blk2.data.id).not.toBe(mock2.id);
            });
        });
    });

    describe("toString", () => {
        it("should return the block as a string", () => {
            const block = new Block(dummyBlock);

            expect(block.toString()).toBe(
                `${dummyBlock.id}, height: ${dummyBlock.height.toLocaleString()}, ${
                    dummyBlock.numberOfTransactions
                } transactions, verified: true, errors: `,
            );
        });
    });
});
