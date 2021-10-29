import { IpcHandler } from "../../../../packages/core-kernel/src/utils/ipc-handler";

type MyRpcInterface = {
    myRpcActionMethod(a: number, b: number): void;
    myRpcRequestMethod(a: number, b: number): Promise<string>;
};

describe("IpcHandler.handleAction", () => {
    it("should call method on process message", () => {
        try {
            const myHandler = { myRpcActionMethod: jest.fn() };
            const ipcHandler = new IpcHandler<MyRpcInterface>(myHandler as any);
            ipcHandler.handleAction("myRpcActionMethod");
            process.listeners("message").forEach((l) => {
                l({ method: "myRpcActionMethod", args: [1, 2] }, null);
            });
            expect(myHandler.myRpcActionMethod).toBeCalledWith(1, 2);
        } finally {
            process.removeAllListeners("message");
        }
    });
});

describe("IpcHandler.handleRequest", () => {
    it("should call method, await result, and send result back", async () => {
        try {
            const myHandler = { myRpcRequestMethod: jest.fn() };
            myHandler.myRpcRequestMethod.mockResolvedValueOnce("hello");
            const ipcHandler = new IpcHandler<MyRpcInterface>(myHandler as any);
            ipcHandler.handleRequest("myRpcRequestMethod");
            process.send = jest.fn();
            process.listeners("message").forEach((l) => {
                l({ id: 1, method: "myRpcRequestMethod", args: [1, 2] }, null);
            });
            await myHandler.myRpcRequestMethod.mock.results[0].value;
            expect(myHandler.myRpcRequestMethod).toBeCalledWith(1, 2);
            expect(process.send).toBeCalledWith({ id: 1, result: "hello" });
        } finally {
            process.removeAllListeners("message");
        }
    });

    it("should call method, await result, catch error and send error back", async () => {
        try {
            const myHandler = { myRpcRequestMethod: jest.fn() };
            myHandler.myRpcRequestMethod.mockRejectedValueOnce(new Error("hello"));
            const ipcHandler = new IpcHandler<MyRpcInterface>(myHandler as any);
            ipcHandler.handleRequest("myRpcRequestMethod");
            process.send = jest.fn();
            process.listeners("message").forEach((l) => {
                l({ id: 1, method: "myRpcRequestMethod", args: [1, 2] }, null);
            });
            try {
                await myHandler.myRpcRequestMethod.mock.results[0].value;
            } catch (error) {}
            expect(myHandler.myRpcRequestMethod).toBeCalledWith(1, 2);
            expect(process.send).toBeCalledWith({ id: 1, error: "hello" });
        } finally {
            process.removeAllListeners("message");
        }
    });
});
