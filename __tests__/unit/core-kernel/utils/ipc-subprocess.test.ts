import { IpcSubprocess } from "../../../../packages/core-kernel/src/utils/ipc-subprocess";

type MyRpcInterface = {
    myRpcActionMethod(a: number, b: number): void;
    myRpcRequestMethod(a: number, b: number): Promise<string>;
};

describe("IpcSubprocess.constructor", () => {
    it("should subscribe to subprocess message event", () => {
        const subprocess = { on: jest.fn() };
        new IpcSubprocess<MyRpcInterface>(subprocess as any);
        expect(subprocess.on).toBeCalledWith("message", expect.any(Function));
    });
});

describe("IpcSubprocess.getQueueSize", () => {
    it("should return pending promises count", () => {
        const subprocess = { on: jest.fn(), send: jest.fn() };
        const ipcSubprocess = new IpcSubprocess<MyRpcInterface>(subprocess as any);
        ipcSubprocess.sendRequest("myRpcRequestMethod", 1, 2);
        const queueSize = ipcSubprocess.getQueueSize();
        expect(queueSize).toBe(1);
    });
});

describe("IpcSubprocess.sendAction", () => {
    it("should call subprocess send method", () => {
        const subprocess = { on: jest.fn(), send: jest.fn() };
        const ipcSubprocess = new IpcSubprocess<MyRpcInterface>(subprocess as any);
        ipcSubprocess.sendAction("myRpcActionMethod", 1, 2);
        expect(subprocess.send).toBeCalledWith({
            method: "myRpcActionMethod",
            args: [1, 2],
        });
    });
});

describe("IpcSubprocess.sendRequest", () => {
    it("should return result when reply message arrives", async () => {
        const subprocess = { on: jest.fn(), send: jest.fn() };
        const ipcSubprocess = new IpcSubprocess<MyRpcInterface>(subprocess as any);

        const promise = ipcSubprocess.sendRequest("myRpcRequestMethod", 1, 2);

        ipcSubprocess["onSubprocessMessage"]({ id: 2, result: "hello" }); // Unknown id, should be ignored
        ipcSubprocess["onSubprocessMessage"]({ id: 1, result: "hello" });

        await expect(promise).resolves.toBe("hello");
        expect(subprocess.send).toBeCalledWith({ id: 1, method: "myRpcRequestMethod", args: [1, 2] });
    });

    it("should rethrow error when reply message arrives", async () => {
        const subprocess = { on: jest.fn(), send: jest.fn() };
        const ipcSubprocess = new IpcSubprocess<MyRpcInterface>(subprocess as any);

        const promise = ipcSubprocess.sendRequest("myRpcRequestMethod", 1, 2);

        ipcSubprocess["onSubprocessMessage"]({ id: 2, error: "failure" }); // Unknown id, should be ignored
        ipcSubprocess["onSubprocessMessage"]({ id: 1, error: "failure" });

        await expect(promise).rejects.toThrowError("failure");
        expect(subprocess.send).toBeCalledWith({ id: 1, method: "myRpcRequestMethod", args: [1, 2] });
    });
});
