import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Models } from "@arkecosystem/core-database";
import { parentPort } from "worker_threads";

import { StreamReader } from "../../filesystem";

export class ReadProcessor {
    private nextField = "";
    private nextValue = undefined;
    private nextCount = undefined;

    private callOnMessage;
    private count = 0;
    private transactionsCount = 0;
    private height = 0;
    private isRunning = false;

    public constructor(
        private cryptoManager: CryptoSuite.CryptoManager,
        private isBlock: boolean,
        private streamReader: StreamReader,
        private onItem: Function,
        private onWait?: Function,
        private onResume?: Function,
    ) {}

    public sync(data: any): void {
        // console.log("Sync", data);

        this.nextField = data.nextField;
        this.nextValue = data.nextValue;
        this.nextCount = data.nextCount;

        if (data.height) {
            /* istanbul ignore next */
            this.cryptoManager.HeightTracker.setHeight(data.height);
        }

        if (this.onResume) {
            /* istanbul ignore next */
            this.onResume();
        }
        this.isRunning = true;

        this.emitCount();

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
        await this.streamReader.open();

        parentPort?.postMessage({
            action: "started",
        });

        await this.waitForSynchronization(false);

        const interval = setInterval(() => {
            if (this.isRunning) {
                /* istanbul ignore next */
                this.emitCount();
            }
        }, 500);

        let previousEntity: any = undefined;
        let entity: any = undefined;

        while ((entity = await this.streamReader.readNext())) {
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

        clearInterval(interval);

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
            while (entity[this.nextField] > this.nextValue!) {
                await this.waitForSynchronization();
            }
            resolve();
        });
    }

    private waitOrContinueCount(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            while (this.count === this.nextCount) {
                /* istanbul ignore next */
                await this.waitForSynchronization();
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
        // parentPort?.postMessage({
        //     action: "log",
        //     data: "wait"
        // })

        parentPort!.postMessage({
            action: "synchronized",
            data: {
                numberOfTransactions: this.transactionsCount,
                height: this.height,
                count: this.count,
            },
        });
    }
}
