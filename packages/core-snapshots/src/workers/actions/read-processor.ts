import { parentPort } from "worker_threads";

import { Managers } from "@arkecosystem/crypto";
import { Models } from "@arkecosystem/core-database";

export class ReadProcessor {
    constructor(
        private isBlock: boolean,
        private readStream: NodeJS.ReadableStream,
        private onItem: Function,
        private onWait?: Function,
        private onResume?: Function,
    ) {}

    private nextField = "";
    private nextValue = undefined;
    private nextCount = undefined;

    private callOnMessage;
    private count = 0;
    private transactionsCount = 0;
    private height = 0;
    private isRunning = false;

    public sync(data: any): void {
        // console.log("Sync", data);

        this.nextField = data.nextField;
        this.nextValue = data.nextValue;
        this.nextCount = data.nextCount;

        if (data.height) {

            console.log("Height", data.height)

            Managers.configManager.setHeight(data.height);
        }

        if (this.onResume) {
            this.onResume();
        }
        this.isRunning = true;

        this.emitCount()

        console.log("RESUME: ", data)
        // On first message is not defined
        if (this.callOnMessage) {
            this.callOnMessage();
        }
    }

    public async start() {
        parentPort?.postMessage({
            action: "started",
        });

        await this.waitForSynchronization(false);

        let interval = setInterval(() => {
            if (this.isRunning) {
                this.emitCount();
            }
        }, 500);

        let previousEntity: any = undefined;
        let entity: any = undefined;

        for await (entity of this.readStream) {
            this.readStream.pause();

            if (!this.isBlock && this.count > 1002869) {
                console.log()
            }

            this.count++;

            if (this.nextValue && entity[this.nextField] > this.nextValue!) {
                await this.waitOrContinue(this.count, previousEntity, entity);
            }


            await this.onItem(entity, previousEntity);

            if (this.nextCount) {
                await this.waitOrContinueCount();
            }

            if (this.isBlock) {
                this.transactionsCount += ((entity as unknown) as Models.Block).numberOfTransactions;
                this.height = ((entity as unknown) as Models.Block).height;
            }

            previousEntity = entity;
        }

        clearInterval(interval!);

        // Need to save last entities
        if (this.onWait) {
            await this.onWait();
        }

        this.emitSynchronized();
    }

    private emitCount(): void {
        parentPort?.postMessage({
            action: "count",
            data: this.count,
        });
    }

    private waitOrContinue(count, previousEntity: any, entity: any): Promise<void> {
        return new Promise<void>(async (resolve) => {
            while (true) {
                if (entity[this.nextField] > this.nextValue!) {
                    await this.waitForSynchronization();
                } else {
                    break;
                }
            }
            resolve();
        });
    }

    private waitOrContinueCount(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            while (true) {
                if (this.count === this.nextCount) {
                    await this.waitForSynchronization();
                } else {
                    break;
                }
            }
            resolve();
        });
    }

    private waitForSynchronization(emit: boolean = true): Promise<void> {
        return new Promise<void>(async (resolve) => {

            console.log("WAIT")

            if (this.onWait) {
                await this.onWait();
            }

            this.isRunning = false;

            this.callOnMessage = (data) => {
                resolve();
            };

            if (emit) {
                this.emitSynchronized();
            }
        });
    }

    private emitSynchronized() {
        parentPort!.postMessage({
            action: "synchronized",
            data: {
                numberOfTransactions: this.transactionsCount,
                height: this.height,
                count: this.count
            }
        });
    }
}
