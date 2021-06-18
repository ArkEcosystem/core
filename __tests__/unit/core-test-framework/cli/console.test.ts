import "jest-extended";

import Joi from "joi";
import { Commands, Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework/src";

const spyOnGetFlag = jest.fn();
const spyOnGetFlagToken = jest.fn();
const spyOnGetFlagNetwork = jest.fn();
const spyOnGetArgument = jest.fn();

@Container.injectable()
class Command extends Commands.Command {
    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "core:test";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Test command.";

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition.setFlag("flagName", "The test message.", Joi.string().default("flagValue"));

        this.definition.setArgument("argumentName", "The test argument.", Joi.string().default("argumentValue"));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        spyOnGetFlag(this.getFlag("flagName"));
        spyOnGetFlagToken(this.getFlag("token"));
        spyOnGetFlagNetwork(this.getFlag("network"));
        spyOnGetArgument(this.getArgument("argumentName"));
    }
}

afterEach(() => {
    jest.clearAllMocks();
});

describe("Console", () => {
    describe("with default flags", () => {
        it("should execute", async () => {
            const console = new Console();

            await expect(console.execute(Command)).toResolve();
            expect(spyOnGetFlag).toHaveBeenCalledWith("flagValue");
            expect(spyOnGetFlagToken).toHaveBeenCalledWith("ark");
            expect(spyOnGetFlagNetwork).toHaveBeenCalledWith("testnet");
            expect(spyOnGetArgument).toHaveBeenCalledWith("argumentValue");
        });

        it("should execute with flags", async () => {
            const console = new Console();

            await expect(console.withFlags({ flagName: "flag_test" }).execute(Command)).toResolve();
            expect(spyOnGetFlag).toHaveBeenCalledWith("flag_test");
            expect(spyOnGetFlagToken).toHaveBeenCalledWith("ark");
            expect(spyOnGetFlagNetwork).toHaveBeenCalledWith("testnet");
            expect(spyOnGetArgument).toHaveBeenCalledWith("argumentValue");
        });

        it("should execute with arguments", async () => {
            const console = new Console();

            await expect(console.withArgs(["test_arg"]).execute(Command)).toResolve();
            expect(spyOnGetFlag).toHaveBeenCalledWith("flagValue");
            expect(spyOnGetFlagToken).toHaveBeenCalledWith("ark");
            expect(spyOnGetFlagNetwork).toHaveBeenCalledWith("testnet");
            expect(spyOnGetArgument).toHaveBeenCalledWith("test_arg");
        });
    });

    describe("without default flags", () => {
        it("should reject due missing flags", async () => {
            const console = new Console(false);

            await expect(console.execute(Command)).toReject();
            expect(spyOnGetFlag).not.toHaveBeenCalled();
        });

        it("should execute with flags", async () => {
            const console = new Console(false);

            await expect(
                console
                    .withFlags({ flagName: "flag_test", token: "dummy_token", network: "dummy_network" })
                    .execute(Command),
            ).toResolve();
            expect(spyOnGetFlag).toHaveBeenCalledWith("flag_test");
            expect(spyOnGetFlagToken).toHaveBeenCalledWith("dummy_token");
            expect(spyOnGetFlagNetwork).toHaveBeenCalledWith("dummy_network");
            expect(spyOnGetArgument).toHaveBeenCalledWith("argumentValue");
        });

        it("should execute with arguments", async () => {
            const console = new Console(false);

            await expect(
                console
                    .withFlags({ token: "dummy_token", network: "dummy_network" })
                    .withArgs(["test_arg"])
                    .execute(Command),
            ).toResolve();
            expect(spyOnGetFlag).toHaveBeenCalledWith("flagValue");
            expect(spyOnGetFlagToken).toHaveBeenCalledWith("dummy_token");
            expect(spyOnGetFlagNetwork).toHaveBeenCalledWith("dummy_network");
            expect(spyOnGetArgument).toHaveBeenCalledWith("test_arg");
        });
    });
});
