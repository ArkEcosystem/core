import { AbstractWorkerAction } from "./abstract-worker-action";
import { Container } from "@arkecosystem/core-kernel";
import { Models } from "@arkecosystem/core-database";
import { Verifier } from "../../verifier";
import { parentPort } from "worker_threads";
import { Managers } from "@arkecosystem/crypto";


@Container.injectable()
export class VerifyWorkerAction extends AbstractWorkerAction {
    // @ts-ignore
    private nextField = "";
    private nextValue = undefined;
    private nextCount = undefined;

    private callOnMessage;

    private transactionsCount = 0;
    private isBlock = false;

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

        this.isBlock = this.table === "blocks"

        let verify = this.getVerifyFunction();

        let readStream = this.getReadStream();

        await this.waitUntilSet();

        let interval = setInterval(() => {
            parentPort?.postMessage({
                action: "count",
                data: count
            });
        }, 100)


        let count = 0;
        let previousEntity: any = undefined;
        let entity: any = undefined;

        for await (entity of readStream) {
            count++;

            if (this.isBlock) {
                this.applyGenesisBlockFix(entity as unknown as Models.Block);

                if (entity[this.nextField] > this.nextValue!) {
                    await this.waitOrContinue(count, previousEntity, entity);
                }
            }

            verify(entity, previousEntity);

            if (this.nextCount) {
                await this.waitOrContinueCount(count);
            }

            if (this.isBlock) {
                this.transactionsCount += (entity as unknown as Models.Block).numberOfTransactions;
            }

            previousEntity = entity;
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
                if (entity[this.nextField] > this.nextValue!) {

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
                    parentPort!.postMessage({
                        action: "synced",
                        data: {}
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
            await this.waitForSynchronization();
            resolve();
        })
    }

    private waitForSynchronization(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            this.callOnMessage = (data) => {
                resolve();
            }
        })
    }

    private getVerifyFunction(): Function {
        switch (this.table) {
            case "blocks":
                return Verifier.verifyBlock;
            case "transactions":
                return Verifier.verifyTransaction;
            case "rounds":
                return Verifier.verifyRound;
            default:
                throw new Error();
        }
    }
}

// class ReadProcesssor {
//     constructor(private isBlock: boolean, private readStream: NodeJS.ReadableStream, private onItem: Function, private onWait: Function) {}
//
//     // @ts-ignore
//     private nextField = "";
//     private nextValue = undefined;
//     private nextCount = undefined;
//
//     private callOnMessage;
//     private transactionsCount = 0;
//
//     public sync(data: any): void {
//         // console.log("Sync", data);
//
//         this.nextField = data.nextField;
//         this.nextValue = data.nextValue;
//         this.nextCount = data.nextCount;
//
//         if (data.height) {
//             Managers.configManager.setHeight(data.height);
//         }
//
//         // On first message is not defined
//         if (this.callOnMessage) {
//             this.callOnMessage();
//         }
//     }
//
//     public async start() {
//         parentPort?.postMessage({
//             action: "started",
//         })
//
//         await this.waitForSynchronization();
//
//         let interval = setInterval(() => {
//             parentPort?.postMessage({
//                 action: "count",
//                 data: count
//             });
//         }, 100)
//
//
//         let count = 0;
//         let previousEntity: any = undefined;
//         let entity: any = undefined;
//
//         for await (entity of this.readStream) {
//             count++;
//
//             if (this.nextValue && entity[this.nextField] > this.nextValue!) {
//                 await this.waitOrContinue(count, previousEntity, entity);
//             }
//
//             // if (this.isBlock) {
//             //     this.applyGenesisBlockFix(entity as unknown as Models.Block);
//             //
//             //     if (entity[this.nextField] > this.nextValue!) {
//             //         await this.waitOrContinue(count, previousEntity, entity);
//             //     }
//             // }
//
//             this.onItem(count, entity, previousEntity);
//
//             // verify(entity, previousEntity);
//
//             if (this.nextCount) {
//                 await this.waitOrContinueCount(count);
//             }
//
//             if (this.isBlock) {
//                 this.transactionsCount += (entity as unknown as Models.Block).numberOfTransactions;
//             }
//
//             previousEntity = entity;
//         }
//
//         clearInterval(interval!);
//
//         parentPort!.postMessage({
//             action: "synced",
//             data: {
//                 numberOfTransactions: this.transactionsCount,
//                 numberOfRounds: count,
//                 previousEntity: previousEntity,
//                 entity: entity
//             }
//         })
//     }
//
//     private waitOrContinue(count, previousEntity: any,  entity: any): Promise<void> {
//         return new Promise<void>(async (resolve) => {
//             while (true) {
//                 if (entity[this.nextField] > this.nextValue!) {
//                     this.onWait();
//
//                     parentPort!.postMessage({
//                         action: "synced",
//                         data: {
//                             numberOfTransactions: this.transactionsCount,
//                             numberOfRounds: count
//                         }
//                     })
//
//                     await this.waitForSynchronization();
//                 }
//                 else {
//                     break;
//                 }
//             }
//             resolve();
//         })
//     }
//
//     private waitOrContinueCount(count): Promise<void> {
//         return new Promise<void>(async (resolve) => {
//             while (true) {
//                 this.onWait();
//
//                 if (count === this.nextCount) {
//                     parentPort!.postMessage({
//                         action: "synced",
//                         data: {}
//                     })
//
//                     await this.waitForSynchronization();
//                 }
//                 else {
//                     break;
//                 }
//             }
//             resolve();
//         })
//     }
//
//     private waitForSynchronization(): Promise<void> {
//         return new Promise<void>(async (resolve) => {
//             this.callOnMessage = (data) => {
//                 resolve();
//             }
//         })
//     }
// }
