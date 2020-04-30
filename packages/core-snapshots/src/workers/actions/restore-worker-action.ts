import { Container } from "@arkecosystem/core-kernel";

import { AbstractWorkerAction } from "./abstract-worker-action";
import { ReadProcessor } from "./read-processor";
import { StreamReader } from "../../filesystem";

@Container.injectable()
export class RestoreWorkerAction extends AbstractWorkerAction {
    private readProcessor: ReadProcessor | undefined = undefined;
    private entities = [] as any[];

    public sync(data: any): void {
        this.readProcessor?.sync(data);
    }

    public async start() {
        let isBlock = this.table === "blocks";
        let streamReader = new StreamReader(this.filePath!, !this.skipCompression, this.getCodec()[`${this.table}Decode`])

        const chunkSize = 1000;

        this.readProcessor = new ReadProcessor(
            isBlock,
            streamReader,
            async (entity: any) => {

                if (isBlock) {
                    this.applyGenesisBlockFix(entity);
                }

                this.entities.push(entity);

                if (this.entities.length === chunkSize) {
                    await this.saveValues();
                }

                // TODO: Add verify
                // verify(entity, previousEntity);
            },
            async () => {
                await this.saveValues();
            }
        );

        await this.readProcessor.start();
    }

    private async saveValues<T>() {
        await this.getRepository().save(this.entities);
        this.entities = [];
    }
}
