import { Models } from "@arkecosystem/core-database";
import { Managers } from "@arkecosystem/crypto";
import { parentPort } from "worker_threads";

import { Worker } from "../../contracts";
import { StreamReader } from "../../filesystem";

export class ReadProcessor {
    private nextField?: string = "";
    private nextValue?: number;
    private nextCount?: number;

    private callOnMessage;
    private count = 0;
    private transactionsCount = 0;
    private height = 0;
    private isRunning = false;

    public constructor(
        private isBlock: boolean,
        private streamReader: StreamReader,
        private onItem: Function,
        private onWait?: Function,
        private onResume?: Function,
    ) {}

    public sync(data: Worker.WorkerSyncData): void {
        this.nextField = data.nextField;
        this.nextValue = data.nextValue;
        this.nextCount = data.nextCount;

        if (data.height) {
            Managers.configManager.setHeight(data.height);
        }

        /* istanbul ignore next */
        if (this.onResume) {
            this.onResume();
        }
        this.isRunning = true;

        this.emitCount();

        // On first message is not defined
        /* istanbul ignore next */
        if (this.callOnMessage) {
            this.callOnMessage();
        }
    }

    public async start(): Promise<void> {
        await this.streamReader.open();

        parentPort!.postMessage({
            action: "started",
        });

        await this.waitForSynchronization(false);

        const interval = setInterval(() => {
            /* istanbul ignore next */
            if (this.isRunning) {
                this.emitCount();
            }
        }, 500);

        let previousEntity: any = undefined;
        let entity: any = undefined;

        while ((entity = await this.streamReader.readNext())) {
            this.count++;

            if (this.nextValue && this.nextField) {
                await this.waitOrContinue(entity);
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
        parentPort!.postMessage({
            action: "count",
            data: this.count,
        });
    }

    private waitOrContinue(entity: any): Promise<void> {
        return new Promise<void>(async (resolve) => {
            while (entity[this.nextField!] > this.nextValue!) {
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
                count: this.count,
            } as Worker.WorkerResult,
        });
    }
}
