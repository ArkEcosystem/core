import "jest-extended";
import { join } from "path";
import { StreamReader } from "@packages/core-snapshots/src/filesystem";
import { ReadProcessor } from "@packages/core-snapshots/src/workers/actions/read-processor";
import { JSONCodec } from "@packages/core-snapshots/src/codecs";
// @ts-ignore
import { parentPort } from "worker_threads";
import { EventEmitter } from "events";


class MockParentPort extends EventEmitter {
    constructor() {
        super();
    }

    public postMessage(data) {
        // console.log(data)
        this.emit(data.action, data.data);
    }
}

let mockParentPort = new MockParentPort()

jest.mock("worker_threads", () => {
    return {
        parentPort: {
            postMessage: (data) => {
                mockParentPort.postMessage(data);
            }
        }
    }
})

const waitUntilStarted = (): Promise<void> => {
    return new Promise<void>((resolve => {
        let onStarted = (data) => {
            resolve();
        }

        mockParentPort.once("started", onStarted)
    }))
}

const waitUntilSynchronized = (): Promise<void> => {
    return new Promise<void>((resolve => {
        let onSynced = (data) => {
            resolve(data);
        }

        mockParentPort.once("synchronized", onSynced)
    }))
}


describe("ReadProcessor", () => {
    it("should read all blocks", async () => {
        let path = join(__dirname, "../__fixtures__/1-52/blocks")

        let streamReader = new StreamReader(path, false, new JSONCodec().decodeBlock)

        await streamReader.open();

        let readProcessor = new ReadProcessor(true, streamReader, async (item) => {
            // console.log(item)
        })

        let wait = waitUntilStarted();

        readProcessor.start();

        await wait;

        await new Promise((resolve => {
            setTimeout(() => {
                resolve();
            }, 1000)
        }))

        readProcessor.sync({nextValue: 1, nextField: "height"});

        await waitUntilSynchronized();

        readProcessor.sync({nextValue: 2, nextField: "height"});

        await waitUntilSynchronized();

        await new Promise((resolve => {
            setTimeout(() => {
                resolve();
            }, 1000)
        }))

        readProcessor.sync({nextValue: 75600, nextField: "height"});

        await expect(waitUntilSynchronized()).resolves.toEqual({ numberOfTransactions: 153, height: 51, count: 51 });
    })
});
