import { parentPort } from "worker_threads";

import { Managers } from "@arkecosystem/crypto";
import { Models } from "@arkecosystem/core-database";
import { StreamReader } from "../../filesystem";

export class ReadProcessor {
    constructor(
        private isBlock: boolean,
        private streamReader: StreamReader,
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

            // console.log("Height", data.height)

            Managers.configManager.setHeight(data.height);
        }

        if (this.onResume) {
            this.onResume();
        }
        this.isRunning = true;

        this.emitCount()


        // parentPort?.postMessage({
        //     action: "log",
        //     data: "Resume: " + JSON.stringify(data)
        // })

        // On first message is not defined
        if (this.callOnMessage) {
            this.callOnMessage();
        }
    }

    public async start() {
        parentPort?.postMessage({
            action: "started",
        });

        await this.streamReader.open();

        await this.waitForSynchronization(false);

        let interval = setInterval(() => {
            if (this.isRunning) {
                this.emitCount();
            }
        }, 500);

        let previousEntity: any = undefined;
        let entity: any = undefined;


        while(entity = await this.streamReader.readNext()) {
            this.count++;

            // parentPort?.postMessage({
            //     action: "log",
            //     data: "count: " + this.count
            // })

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

        await this.waitForSynchronization();
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

            // parentPort?.postMessage({
            //     action: "log",
            //     data: "Wait: "
            // })

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
