import { Console } from "@arkecosystem/core-test-framework";
import { setGracefulCleanup } from "tmp";
import Joi from "@hapi/joi";

import { Command } from "@packages/core-cli/src/commands";
import { Container } from "@arkecosystem/core-cli";

@Container.injectable()
class StubCommand extends Command {
    public configure(): void {
        this.definition.setArgument("firstName", "description", Joi.string());
        this.definition.setArgument("lastName", "description", Joi.string());

        this.definition.setFlag("token", "description", Joi.string());
        this.definition.setFlag("network", "description", Joi.string().default("testnet"));
        this.definition.setFlag("hello", "description", Joi.string());
    }

    public async execute(): Promise<void> {
        //
    }
}

let cli;
let cmd;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(StubCommand);
    cmd.register(["env:paths", "john", "doe", "--hello=world"]);
});

afterEach(() => jest.resetAllMocks());

describe("Command", () => {
    describe("#register", () => {
        it("should register the command", () => {
            cmd.register(["env:paths", "john", "doe", "--hello=world"]);
        });

        it("should register the command with an output verbosity of quiet", () => {
            cmd.register(["env:paths", "--quiet"]);
        });

        it("should register the command with an output verbosity of normal", () => {
            cmd.register(["env:paths", "-v"]);
        });

        it("should register the command with an output verbosity of verbose", () => {
            cmd.register(["env:paths", "-vv"]);
        });

        it("should register the command with an output verbosity of debug", () => {
            cmd.register(["env:paths", "-vvv"]);
        });

        it("should register the command and encounter an error", () => {
            jest.spyOn(cli.app.get(Container.Identifiers.Output), "setVerbosity").mockImplementation(() => {
                throw new Error("I am an error");
            });

            expect(() => cmd.register(["env:paths", "--quiet"])).toThrow("I am an error");
        });
    });

    describe("#configure", () => {
        it("should configure the command", () => {
            expect(cmd.configure()).toBeUndefined();
        });
    });

    describe("#initialize", () => {
        it("should initialize the command", () => {
            expect(cmd.initialize()).resolves.toBeUndefined();
        });
    });

    describe("#interact", () => {
        it("should interact with the user", () => {
            expect(cmd.interact()).resolves.toBeUndefined();
        });
    });

    describe("#run", () => {
        it("should run the command with the given token and network", async () => {
            cmd.setFlag("token", "ark");
            cmd.setFlag("network", "testnet");

            await cmd.run();
        });

        it("should run the command without a network", async () => {
            cmd.requiresNetwork = false;

            await cmd.run();
        });

        it("should run the command in interactive mode", async () => {
            cmd.register(["env:paths", "--interaction"]);

            const interact = jest.spyOn(cmd, "interact");

            await cmd.run();

            expect(interact).toHaveBeenCalled();
        });

        it("should run the command in non-interactive mode", async () => {
            cmd.register(["env:paths", "--no-interaction"]);

            const interact = jest.spyOn(cmd, "interact");

            await cmd.run();

            expect(interact).not.toHaveBeenCalled();
        });

        it("should run the command and try to detect a network", async () => {
            cmd.input.setFlag("token", "ark");
            cmd.input.setFlag("network", undefined);

            await expect(cmd.run()).rejects.toThrow();
        });

        it("should run the command and throw an error", async () => {
            jest.spyOn(cmd, "initialize").mockImplementation(() => {
                throw new Error("I am an error");
            });

            await expect(cmd.run()).rejects.toThrow("I am an error");
        });
    });

    describe("#execute", () => {
        it("should execute the command", async () => {
            expect(cmd.execute()).resolves.toBeUndefined();
        });
    });

    describe("#showHelp", () => {
        it("should display the help", () => {
            let output;
            jest.spyOn(cli.app.get(Container.Identifiers.Box), "render").mockImplementation(
                (message: string) => (output = message),
            );

            cmd.showHelp("firstName");

            expect(output).toInclude("firstName");
            expect(output).toInclude("lastName");
            expect(output).toInclude("--hello");
        });
    });

    describe("#getArguments", () => {
        it("should get all arguments", () => {
            expect(cmd.getArguments()).toEqual({ firstName: "john", lastName: "doe" });
        });
    });

    describe("#getArgument", () => {
        it("should get the value of an argument", () => {
            expect(cmd.getArgument("firstName")).toBe("john");
        });
    });

    describe("#setArgument", () => {
        it("should set the value of an argument", () => {
            expect(cmd.getArgument("firstName")).toBe("john");

            cmd.setArgument("firstName", "jane");

            expect(cmd.getArgument("firstName")).toBe("jane");
        });
    });

    describe("#hasArgument", () => {
        it("should check if an argument exists", () => {
            expect(cmd.hasArgument("firstName")).toBeTrue();
            expect(cmd.hasArgument("something")).toBeFalse();
        });
    });

    describe("#getFlags", () => {
        it("should get all flags", () => {
            expect(cmd.getFlags()).toEqual({ network: "testnet", hello: "world", v: 0 });
        });
    });

    describe("#getFlag", () => {
        it("should get the value of a flag", () => {
            expect(cmd.getFlag("hello")).toBe("world");
        });
    });

    describe("#setFlag", () => {
        it("should set the value of a flag", () => {
            expect(cmd.getFlag("hello")).toBe("world");

            cmd.setFlag("hello", "jane");

            expect(cmd.getFlag("hello")).toBe("jane");
        });
    });

    describe("#hasFlag", () => {
        it("should check if a flag exists", () => {
            expect(cmd.hasFlag("hello")).toBeTrue();
            expect(cmd.hasFlag("something")).toBeFalse();
        });
    });
});
