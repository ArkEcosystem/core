import "jest-extended";

import Joi from "joi";
import { Commands, Container } from "@packages/core-cli";
import { Console } from "@packages/core-test-framework/src";

const spyOnExecute = jest.fn();

@Container.injectable()
export class Command extends Commands.Command {
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
        this.definition.setFlag("test", "The test message.", Joi.string().default("test"));

        this.definition.setArgument("test_arg", "The test argument.", Joi.string().default("test"));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        spyOnExecute(this.getFlag("test"));
        // spyOnExecute(this.getArguments("test"));
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
            expect(spyOnExecute).toHaveBeenCalledWith("test");
        });

        it("should execute with flags", async () => {
            const console = new Console();

            await expect(console.withFlags({ test: "flag_test" }).execute(Command)).toResolve();
            expect(spyOnExecute).toHaveBeenCalledWith("flag_test");
        });

        // TODO: Add support for arguments in console class
        it("should execute with arguments", async () => {
            const console = new Console();

            await expect(console.withArgs(["-test_arg test123"]).execute(Command)).toResolve();
            expect(spyOnExecute).toHaveBeenCalledWith("test");
        });
    });

    describe("without default flags", () => {
        it("should reject due missing flags", async () => {
            const console = new Console(false);

            await expect(console.execute(Command)).toReject();
            expect(spyOnExecute).not.toHaveBeenCalled();
        });

        it("should execute with flags", async () => {
            const console = new Console(false);

            await expect(
                console
                    .withFlags({ test: "flag_test", token: "dummy_token", network: "dummy_network" })
                    .execute(Command),
            ).toResolve();
            expect(spyOnExecute).toHaveBeenCalledWith("flag_test");
        });

        // TODO: Add support for arguments in console class
        it("should execute with arguments", async () => {
            const console = new Console(false);

            await expect(
                console
                    .withFlags({ token: "dummy_token", network: "dummy_network" })
                    .withArgs(["-test_arg test123"])
                    .execute(Command),
            ).toResolve();
            expect(spyOnExecute).toHaveBeenCalledWith("test");
        });
    });
});
