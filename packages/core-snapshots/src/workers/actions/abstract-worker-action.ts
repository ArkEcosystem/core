import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

import { Codec, Repository, RepositoryFactory, Stream, Worker, WorkerAction } from "../../contracts";
import { StreamReader, StreamWriter } from "../../filesystem";
import { Identifiers } from "../../ioc";
import { Verifier } from "../../verifier";

@Container.injectable()
export abstract class AbstractWorkerAction implements WorkerAction {
    protected table?: string;
    protected codec?: string;
    protected skipCompression?: boolean;
    protected filePath?: string;
    protected genesisBlockId?: string;
    protected updateStep?: number;

    protected options?: Worker.ActionOptions;

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    public init(options: Worker.ActionOptions) {
        this.table = options.table;
        this.codec = options.codec;
        this.skipCompression = options.skipCompression;
        this.filePath = options.filePath;
        this.genesisBlockId = options.genesisBlockId;
        this.updateStep = options.updateStep;

        this.options = options;

        Managers.configManager.setFromPreset(options.network);
    }

    protected getRepository(): Repository {
        const repositoryFactory = this.app.get<RepositoryFactory>(Identifiers.SnapshotRepositoryFactory);

        return repositoryFactory(this.table!);
    }

    protected getStreamReader(): StreamReader {
        const streamReaderFactory = this.app.get<Stream.StreamReaderFactory>(Identifiers.StreamReaderFactory);

        return streamReaderFactory(this.filePath!, !this.skipCompression!, this.getCodec()[`${this.table}Decode`]);
    }

    protected getStreamWriter(dbStream: NodeJS.ReadableStream): StreamWriter {
        const streamWriterFactory = this.app.get<Stream.StreamWriterFactory>(Identifiers.StreamWriterFactory);

        return streamWriterFactory(
            dbStream,
            this.filePath!,
            !this.skipCompression!,
            this.getCodec()[`${this.table}Encode`],
        );
    }

    protected applyGenesisBlockFix(block: Models.Block): void {
        if (block.height === 1) {
            block.id = this.genesisBlockId!;
        }
    }

    protected getCodec(): Codec {
        return this.app.getTagged<Codec>(Identifiers.SnapshotCodec, "codec", this.codec);
    }

    protected getVerifyFunction(): Function {
        if (this.table === "blocks") {
            return Verifier.verifyBlock;
        } if (this.table === "transactions") {
            return Verifier.verifyTransaction;
        }
        return Verifier.verifyRound;
    }

    public abstract async start();

    public abstract sync(data: any);
}
