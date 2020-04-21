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
    private isRunning = false;

    public sync(data: any): void {
        // console.log("Sync", data);

        this.nextField = data.nextField;
        this.nextValue = data.nextValue;
        this.nextCount = data.nextCount;

        if (data.height) {
            Managers.configManager.setHeight(data.height);
        }

        if (this.onResume) {
            this.onResume();
        }
        this.isRunning = true;

        this.emitCount()

        // On first message is not defined
        if (this.callOnMessage) {
            this.callOnMessage();
        }
    }

    public async start() {
        parentPort?.postMessage({
            action: "started",
        });

        await this.waitForSynchronization(undefined, false);

        let interval = setInterval(() => {
            if (this.isRunning) {
                this.emitCount();
            }
        }, 500);

        let previousEntity: any = undefined;
        let entity: any = undefined;

        for await (entity of this.readStream) {
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
            }

            previousEntity = entity;
        }

        clearInterval(interval!);

        parentPort!.postMessage({
            action: "synced",
            data: {
                numberOfTransactions: this.transactionsCount,
                numberOfRounds: this.count,
                previousEntity: previousEntity,
                entity: entity,
            },
        });
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
                    let data =  {
                        numberOfTransactions: this.transactionsCount,
                        numberOfRounds: count,
                    }

                    await this.waitForSynchronization(data);
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

    private waitForSynchronization(data?: any, emit: boolean = true): Promise<void> {
        return new Promise<void>(async (resolve) => {

            if (this.onWait) {
                await this.onWait();
            }

            this.isRunning = false;

            this.callOnMessage = (data) => {
                resolve();
            };

            if (emit) {
                // console.log("Emitt: ", data ? data : {})

                parentPort!.postMessage({
                    action: "synchronized",
                    data: data ? data : {}
                });
            }
        });
    }
}
