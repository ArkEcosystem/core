import "jest-extended";

import { CommandLineInterface } from "@packages/core/src/cli";
import prompts from "prompts";

afterEach(() => jest.resetAllMocks());

describe("CLI", () => {
    it("should run successfully using valid commands", async () => {
        const cli = new CommandLineInterface(["help"]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
    });

    it("should reject when using invalid commands", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        let message: string;
        jest.spyOn(console, "warn").mockImplementationOnce(m => (message = m));

        const cli = new CommandLineInterface(["hello"]);
        prompts.inject([false]);
        await expect(cli.execute("./packages/core/dist")).toReject();

        expect(message).toContain(`is not a ark command.`);
        expect(mockExit).toHaveBeenCalled();
    });

    it("should exit when the command doesn't have a valid signature", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        const cli = new CommandLineInterface(["--nope"]);
        await expect(cli.execute("./packages/core/dist")).toReject();
        expect(mockExit).toHaveBeenCalled();
    });

    it("should exit when a valid command appears with the help flag", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        const cli = new CommandLineInterface(["update", "--help"]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
        expect(mockExit).toHaveBeenCalled();
    });

    it("should execute a suggested command", async () => {
        // @ts-ignore
        const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
        const cli = new CommandLineInterface(["hello"]);
        prompts.inject([true]);
        await expect(cli.execute("./packages/core/dist")).toResolve();
        expect(mockExit).not.toHaveBeenCalled();
    });
});
