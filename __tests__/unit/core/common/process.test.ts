import prompts from "prompts";
import os from "os";

import {
    daemonizeProcess,
    restartProcess,
    restartRunningProcess,
    restartRunningProcessWithPrompt,
    abortRunningProcess,
    abortStoppedProcess,
    abortErroredProcess,
    abortUnknownProcess,
    abortMissingProcess,
} from "@packages/core/src/common/process";
import { processManager } from "@packages/core/src/common/process-manager";

const processName: string = "ark-core";

describe("restartProcess", () => {
    it("should restart the process", async () => {
        const spy = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        restartProcess("ark-core");

        expect(spy).toHaveBeenCalledWith(processName);

        spy.mockClear();
    });

    it("should throw if the process does not exist", async () => {
        const spy = jest.spyOn(processManager, "restart").mockImplementation(() => {
            throw new Error("hello world");
        });

        expect(() => restartProcess("ark-core")).toThrow("hello world");
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist (with stderr)", async () => {
        const spy = jest.spyOn(processManager, "restart").mockImplementation(() => {
            const error: Error = new Error("hello world");
            // @ts-ignore
            error.stderr = "error output";

            throw error;
        });

        expect(() => restartProcess("ark-core")).toThrow("hello world: error output");
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});

describe("restartRunningProcess", () => {
    it("should not restart the process if it is not online", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await restartRunningProcess(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).not.toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });

    it("should restart the process", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await restartRunningProcess(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });
});

describe("restartRunningProcessWithPrompt", () => {
    it("should not restart the process if it is not online", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await restartRunningProcessWithPrompt(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).not.toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });

    it("should restart the process", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([true]);

        await restartRunningProcessWithPrompt(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });

    it("should not restart the process if it is not confirmed", async () => {
        const spyOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const spyRestart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([false]);

        await restartRunningProcessWithPrompt(processName);

        expect(spyOnline).toHaveBeenCalled();
        expect(spyRestart).not.toHaveBeenCalled();

        spyOnline.mockClear();
        spyRestart.mockClear();
    });
});

describe("abortRunningProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "isOnline").mockReturnValue(false);

        expect(abortRunningProcess(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "isOnline").mockReturnValue(true);

        expect(() => abortRunningProcess(processName)).toThrow(`The "${processName}" process is already running.`);
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});

describe("abortStoppedProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "isStopped").mockReturnValue(false);

        expect(abortStoppedProcess(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "isStopped").mockReturnValue(true);

        expect(() => abortStoppedProcess(processName)).toThrow(`The "${processName}" process is not running.`);
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});

describe("abortErroredProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "isErrored").mockReturnValue(false);

        expect(abortErroredProcess(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "isErrored").mockReturnValue(true);

        expect(() => abortErroredProcess(processName)).toThrow(`The "${processName}" process has errored.`);
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});

describe("abortUnknownProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);

        expect(abortUnknownProcess(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "isUnknown").mockReturnValue(true);

        expect(() => abortUnknownProcess(processName)).toThrow(
            `The "${processName}" process has entered an unknown state.`,
        );
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});

describe("abortMissingProcess", () => {
    it("should not throw if the process does exist", () => {
        const spy = jest.spyOn(processManager, "missing").mockReturnValue(false);

        expect(abortMissingProcess(processName)).toBeUndefined();
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });

    it("should throw if the process does not exist", () => {
        const spy = jest.spyOn(processManager, "missing").mockReturnValue(true);

        expect(() => abortMissingProcess(processName)).toThrow(`The "${processName}" process does not exist.`);
        expect(spy).toHaveBeenCalled();

        spy.mockClear();
    });
});

describe("daemonizeProcess", () => {
    it("should throw if the process has entered an unknown state", () => {
        const has = jest.spyOn(processManager, "has").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(true);

        expect(() =>
            daemonizeProcess(
                {
                    name: "ark-core",
                    script: "script",
                    args: "core:run --daemon",
                },
                {},
            ),
        ).toThrow('The "ark-core" process has entered an unknown state.');

        expect(has).toHaveBeenCalledWith("ark-core");
        expect(isUnknown).toHaveBeenCalledWith("ark-core");

        has.mockClear();
        isUnknown.mockClear();
    });

    it("should throw if the process is running", () => {
        const has = jest.spyOn(processManager, "has").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);

        expect(() =>
            daemonizeProcess(
                {
                    name: "ark-core",
                    script: "script",
                    args: "core:run --daemon",
                },
                {},
            ),
        ).toThrow('The "ark-core" process is already running.');

        expect(has).toHaveBeenCalledWith("ark-core");
        expect(isUnknown).toHaveBeenCalledWith("ark-core");
        expect(isOnline).toHaveBeenCalledWith("ark-core");

        has.mockClear();
        isUnknown.mockClear();
        isOnline.mockClear();
    });

    it("should run with the [no-daemon] flag if the daemon flag is not set", () => {
        const has = jest.spyOn(processManager, "has").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const freemem = jest.spyOn(os, "freemem").mockReturnValue(99999999999);
        const totalmem = jest.spyOn(os, "totalmem").mockReturnValue(99999999999);
        const start = jest.spyOn(processManager, "start").mockImplementation(undefined);

        daemonizeProcess(
            {
                name: "ark-core",
                script: "script",
                args: "core:run --daemon",
            },
            {},
        );

        expect(has).toHaveBeenCalledWith("ark-core");
        expect(isUnknown).toHaveBeenCalledWith("ark-core");
        expect(isOnline).toHaveBeenCalledWith("ark-core");
        expect(freemem).toHaveBeenCalled();
        expect(totalmem).toHaveBeenCalled();
        expect(start).toHaveBeenCalledWith(
            {
                args: "core:run --daemon",
                env: { CORE_ENV: undefined, NODE_ENV: "production" },
                name: "ark-core",
                node_args: undefined,
                script: "script",
            },
            { "kill-timeout": 30000, "max-restarts": 5, name: "ark-core", "no-daemon": true },
        );

        has.mockClear();
        isUnknown.mockClear();
        isOnline.mockClear();
        freemem.mockClear();
        totalmem.mockClear();
        start.mockClear();
    });

    it("should run with potato settings", () => {
        const has = jest.spyOn(processManager, "has").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const freemem = jest.spyOn(os, "freemem").mockReturnValue(1);
        const totalmem = jest.spyOn(os, "totalmem").mockReturnValue(1);
        const start = jest.spyOn(processManager, "start").mockImplementation(undefined);

        daemonizeProcess(
            {
                name: "ark-core",
                script: "script",
                args: "core:run --daemon",
            },
            {},
        );

        expect(has).toHaveBeenCalledWith("ark-core");
        expect(isUnknown).toHaveBeenCalledWith("ark-core");
        expect(isOnline).toHaveBeenCalledWith("ark-core");
        expect(freemem).toHaveBeenCalled();
        expect(totalmem).toHaveBeenCalled();
        expect(start).toHaveBeenCalledWith(
            {
                args: "core:run --daemon",
                env: {
                    CORE_ENV: undefined,
                    NODE_ENV: "production",
                },
                name: "ark-core",
                node_args: {
                    max_old_space_size: 500,
                },
                script: "script",
            },
            { "kill-timeout": 30000, "max-restarts": 5, name: "ark-core", "no-daemon": true },
        );

        has.mockClear();
        isUnknown.mockClear();
        isOnline.mockClear();
        freemem.mockClear();
        totalmem.mockClear();
        start.mockClear();
    });

    it("should throw if an unknown error occurs", () => {
        const has = jest.spyOn(processManager, "has").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const freemem = jest.spyOn(os, "freemem").mockReturnValue(99999999999);
        const totalmem = jest.spyOn(os, "totalmem").mockReturnValue(99999999999);
        const start = jest.spyOn(processManager, "start").mockImplementation(() => {
            throw new Error("unexpected error");
        });

        expect(() =>
            daemonizeProcess(
                {
                    name: "ark-core",
                    script: "script",
                    args: "core:run --daemon",
                },
                {},
            ),
        ).toThrow("unexpected error");

        expect(has).toHaveBeenCalledWith("ark-core");
        expect(isUnknown).toHaveBeenCalledWith("ark-core");
        expect(isOnline).toHaveBeenCalledWith("ark-core");
        expect(freemem).toHaveBeenCalled();
        expect(totalmem).toHaveBeenCalled();
        expect(start).toHaveBeenCalledWith(
            {
                args: "core:run --daemon",
                env: { CORE_ENV: undefined, NODE_ENV: "production" },
                name: "ark-core",
                node_args: undefined,
                script: "script",
            },
            { "kill-timeout": 30000, "max-restarts": 5, name: "ark-core", "no-daemon": true },
        );

        has.mockClear();
        isUnknown.mockClear();
        isOnline.mockClear();
        freemem.mockClear();
        totalmem.mockClear();
        start.mockClear();
    });

    it("should throw if an unknown error occurs (with stdrr)", () => {
        const has = jest.spyOn(processManager, "has").mockReturnValue(true);
        const isUnknown = jest.spyOn(processManager, "isUnknown").mockReturnValue(false);
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(false);
        const freemem = jest.spyOn(os, "freemem").mockReturnValue(99999999999);
        const totalmem = jest.spyOn(os, "totalmem").mockReturnValue(99999999999);
        const start = jest.spyOn(processManager, "start").mockImplementation(() => {
            const error: Error = new Error("hello world");
            // @ts-ignore
            error.stderr = "unexpected error";

            throw error;
        });

        expect(() =>
            daemonizeProcess(
                {
                    name: "ark-core",
                    script: "script",
                    args: "core:run --daemon",
                },
                {},
            ),
        ).toThrow("hello world: unexpected error");

        expect(has).toHaveBeenCalledWith("ark-core");
        expect(isUnknown).toHaveBeenCalledWith("ark-core");
        expect(isOnline).toHaveBeenCalledWith("ark-core");
        expect(freemem).toHaveBeenCalled();
        expect(totalmem).toHaveBeenCalled();
        expect(start).toHaveBeenCalledWith(
            {
                args: "core:run --daemon",
                env: { CORE_ENV: undefined, NODE_ENV: "production" },
                name: "ark-core",
                node_args: undefined,
                script: "script",
            },
            { "kill-timeout": 30000, "max-restarts": 5, name: "ark-core", "no-daemon": true },
        );

        has.mockClear();
        isUnknown.mockClear();
        isOnline.mockClear();
        freemem.mockClear();
        totalmem.mockClear();
        start.mockClear();
    });
});
