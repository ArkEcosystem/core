import "jest-extended";

// @ts-ignore
import { workerData, parentPort } from "worker_threads";

import * as typeorm from "typeorm";
import { init } from "@packages/core-snapshots/src/workers/worker";
import { DumpWorkerAction } from "@packages/core-snapshots/src/workers/actions/dump-worker-action";

DumpWorkerAction.prototype.start = jest.fn();

let spyOnGetCustomRepository = jest.spyOn(typeorm, "getCustomRepository").mockReturnValue(undefined);
let spyOnCreateConnection = jest.spyOn(typeorm, "createConnection").mockResolvedValue({ close: () => {}} as any);

jest.mock('worker_threads', ()=> {
    return {
        workerData : {
            actionOptions: {
                action: "dump",
                table: "blocks",
                codec: "default",
                skipCompression: false,
                filePath: "",
                genesisBlockId: "123",
                updateStep: 1000
            },
            connection: {}
        }
    }
});

describe("Worker", () => {
    it("should run worker", async () => {
        await init();

        expect(spyOnGetCustomRepository).toHaveBeenCalled();
        expect(spyOnCreateConnection).toHaveBeenCalled();
    });
});
