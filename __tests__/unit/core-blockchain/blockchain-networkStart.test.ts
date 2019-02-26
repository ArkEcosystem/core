/* tslint:disable:max-line-length */
import "../../utils";
import { asValue } from "awilix";
import { Blockchain } from "../../../packages/core-blockchain/src/blockchain";
import { defaults } from "../../../packages/core-blockchain/src/defaults";
import { setUp, tearDown } from "./__support__/setup";

let container;
let blockchain: Blockchain;

describe("constructor - networkStart", () => {
    let logger;
    beforeAll(async () => {
        container = await setUp();

        logger = container.resolvePlugin("logger");
    });
    afterAll(async () => {
        await tearDown();

        jest.restoreAllMocks();
    });

    it("should output log messages if launched in networkStart mode", async () => {
        const loggerWarn = jest.spyOn(logger, "warn");
        const loggerInfo = jest.spyOn(logger, "info");

        await __start(true);

        expect(loggerWarn).toHaveBeenCalledWith(
            "Ark Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong. :warning:",
        );
        expect(loggerInfo).toHaveBeenCalledWith("Starting Ark Core for a new world, welcome aboard :rocket:");
    });

    describe("dispatch", () => {
        it("should be ok", () => {
            const nextState = blockchain.dispatch("START");

            expect(blockchain.state.blockchain).toEqual(nextState);
        });

        it("should log an error if no action is found", () => {
            const stateMachine = require("../../../packages/core-blockchain/src/state-machine").stateMachine;
            const loggerError = jest.spyOn(logger, "error");

            // @ts-ignore
            jest.spyOn(stateMachine, "transition").mockReturnValueOnce({
                actions: ["yooo"],
            });

            blockchain.dispatch("STOP");
            expect(loggerError).toHaveBeenCalledWith("No action 'yooo' found :interrobang:");
        });
    });
});

async function __start(networkStart) {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    process.env.CORE_ENV = "false";

    const plugin = require("../../../packages/core-blockchain/src").plugin;

    blockchain = await plugin.register(container, {
        networkStart,
        ...defaults,
    });

    await container.register(
        "blockchain",
        asValue({
            name: "blockchain",
            version: "0.1.0",
            plugin: blockchain,
            options: {},
        }),
    );
}
