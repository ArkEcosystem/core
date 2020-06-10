import "jest-extended";

import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Application } from "@packages/core-kernel/src/application";
import { LoadCryptography } from "@packages/core-kernel/src/bootstrap/app";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

let app: Application;
let configRepository: ConfigRepository;

beforeEach(() => {
    app = new Application(new Container());
    configRepository = app.get<ConfigRepository>(Identifiers.ConfigRepository);
});

describe("LoadCryptography", () => {
    it("should bootstrap from the network name", async () => {
        // Doesn't really matter network we use here as we don't rely on any specific values
        app.bind(Identifiers.ApplicationNetwork).toConstantValue("testnet");

        await app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

        expect(
            app.get<CryptoSuite.CryptoManager>(Identifiers.CryptoManager).NetworkConfigManager.all(),
        ).toContainAllKeys(["network", "exceptions", "milestones", "genesisBlock"]);
    });

    it("should bootstrap from the configuration repository", async () => {
        const genesisBlock = {
            type: 0,
            amount: "245098000000000",
            fee: "0",
            recipientId: "AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri",
            timestamp: 0,
            asset: {},
            senderPublicKey: "035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788",
            signature:
                "304402205fcb0677e06bde7aac3dc776665615f4b93ef8c3ed0fddecef9900e74fcb00f302206958a0c9868ea1b1f3d151bdfa92da1ce24de0b1fcd91933e64fb7971e92f48d",
            id: "db1aa687737858cc9199bfa336f9b1c035915c30aaee60b1e0f8afadfdb946bd",
        };
        configRepository.merge({
            crypto: {
                genesisBlock: { transactions: [genesisBlock] },
                exceptions: {},
                milestones: [],
                network: {},
            },
        });

        await app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

        expect(
            app.get<CryptoSuite.CryptoManager>(Identifiers.CryptoManager).NetworkConfigManager.all(),
        ).toContainAllKeys(["network", "exceptions", "milestones", "genesisBlock"]);
        expect(
            app
                .get<CryptoSuite.CryptoManager>(Identifiers.CryptoManager)
                .NetworkConfigManager.get("genesisBlock.transactions"),
        ).toEqual([genesisBlock]);
    });

    it("should bootstrap from the empty configuration repository", async () => {
        configRepository.merge({
            crypto: {
                genesisBlock: {},
                exceptions: {},
                milestones: [],
                network: {},
            },
        });

        await app.resolve<LoadCryptography>(LoadCryptography).bootstrap();

        expect(
            app.get<CryptoSuite.CryptoManager>(Identifiers.CryptoManager).NetworkConfigManager.all(),
        ).toContainAllKeys(["network", "exceptions", "milestones", "genesisBlock"]);
    });
});
