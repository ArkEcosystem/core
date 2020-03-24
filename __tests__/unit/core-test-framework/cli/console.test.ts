import "jest-extended";

import { Console } from "@packages/core-test-framework/src";
import { Commands, Container } from "@packages/core-cli";
import Joi from "@hapi/joi";

let spyOnExecute = jest.fn();

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
        this.definition
            .setFlag("test", "The test message.", Joi.string().default("test"));

        this.definition
            .setArgument("test_arg", "The test argument.", Joi.string().default("test"));
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
        console.log(this.getFlags());
        console.log(this.getArguments());
    }
}

describe("Console", () => {
    it("should execute", async () => {
        let console = new Console();

        await expect(console.execute(Command)).toResolve();
        expect(spyOnExecute).toHaveBeenCalledWith("test");
    });

    it("should execute with flags", async () => {
        let console = new Console();

        await expect(console.withFlags({ test: "flag_test" }).execute(Command)).toResolve();
        expect(spyOnExecute).toHaveBeenCalledWith("flag_test");
    });

    // TODO: Add support for arguments
    // it("should execute with arguments", async () => {
    //     let console = new Console();
    //
    //     await expect(console.withArgs(["-test_arg test123"]).execute(Command)).toResolve();
    //     expect(spyOnExecute).toHaveBeenCalledWith("test");
    // });
});
