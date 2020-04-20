import { AbstractWorkerAction } from "./abstract-worker-action";
import { Container } from "@arkecosystem/core-kernel";
import { Models } from "@packages/core-database";
import { parentPort } from "worker_threads";
import { Managers } from "@arkecosystem/crypto";


@Container.injectable()
export class RestoreWorkerAction extends AbstractWorkerAction {
    // @ts-ignore
    private nextField = "";
    private nextValue = undefined;
    private nextCount = undefined;

    private callOnMessage;

    private transactionsCount = 0;
    private entities: any[] = [];

    public sync(data: any): void {
        // console.log("Sync", data);

        this.nextField = data.nextField;
        this.nextValue = data.nextValue;
        this.nextCount = data.nextCount;

        if (data.height) {
            Managers.configManager.setHeight(data.height);
        }

        // On first message is not defined
        if (this.callOnMessage) {
            this.callOnMessage();
        }
    }

    public async start() {
        parentPort?.postMessage({
            action: "started",
        })

        let readStream = this.getReadStream();


        const chunkSize = 1000;
        let count = 0;

        await this.waitUntilSet();

        let interval = setInterval(() => {
            parentPort?.postMessage({
                action: "count",
                data: count
            });
        }, 100)

        let previousEntity: any = undefined;
        let entity: any = undefined;
        for await (entity of readStream) {
            count++;

            if (this.table === "blocks") {
                this.applyGenesisBlockFix(entity as unknown as Models.Block);

                await this.waitOrContinue(count, previousEntity, entity);
            } else {
                // @ts-ignore
                // console.log("Entity: ", count, this.nextCount, entity.timestamp);
            }

            this.entities.push(entity);

            if (this.nextCount) {
                await this.waitOrContinueCount(count);
            }

            if (this.entities.length === chunkSize) {
                await this.saveValues();
            }

            if (this.table === "blocks") {
                this.transactionsCount += (entity as unknown as Models.Block).numberOfTransactions;
            }

            previousEntity = entity;
        }

        if (this.entities.length) {
            await this.saveValues();
        }

        clearInterval(interval!);

        parentPort!.postMessage({
            action: "synced",
            data: {
                numberOfTransactions: this.transactionsCount,
                numberOfRounds: count,
                previousEntity: previousEntity,
                entity: entity
            }
        })
    }

    private waitOrContinue(count, previousEntity: any,  entity: any): Promise<void> {
        return new Promise<void>(async (resolve) => {
            while (true) {
                if (!this.nextValue || entity[this.nextField] > this.nextValue!) {
                    await this.saveValues();

                    parentPort!.postMessage({
                        action: "synced",
                        data: {
                            numberOfTransactions: this.transactionsCount,
                            numberOfRounds: count,
                            previousEntity: previousEntity,
                            entity: entity
                        }
                    })

                    // console.log("WAIT", this.table, entity);

                    await this.waitForSynchronization();
                }
                else {
                    break;
                }
            }
            resolve();
        })
    }

    private waitOrContinueCount(count): Promise<void> {
        return new Promise<void>(async (resolve) => {
            while (true) {
                if (count === this.nextCount) {
                    await this.saveValues();

                    parentPort!.postMessage({
                        action: "synced",
                        data: {
                            // numberOfTransactions: this.transactionsCount,
                            // numberOfRounds: count,
                            // previousEntity: previousEntity,
                            // entity: entity
                        }
                    })

                    await this.waitForSynchronization();
                }
                else {
                    break;
                }
            }
            resolve();
        })
    }

    private waitUntilSet(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            // if (!this.nextCount && !this.nextValue) {
            //     parentPort!.postMessage({
            //         action: "synced",
            //         data: {
            //             // numberOfTransactions: this.transactionsCount,
            //             // numberOfRounds: count,
            //             // previousEntity: previousEntity,
            //             // entity: entity
            //         }
            //     })
            //
            //     await this.waitForSynchronization();
            // }
            await this.waitForSynchronization();
            resolve();
        })
    }

    private waitForSynchronization(): Promise<void> {
        // console.log("Waitning for SYNC")

        return new Promise<void>(async (resolve) => {
            this.callOnMessage = (data) => {
                resolve();
            }
        })
    }

    private async saveValues<T>() {
        await this.getRepository().save(this.entities);
        this.entities = [];
    }
}
