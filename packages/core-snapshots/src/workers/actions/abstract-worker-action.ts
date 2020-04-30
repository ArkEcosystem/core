import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { Codec, WorkerAction, Repository, Worker, RepositoryFactory, Stream } from "../../contracts";
import { Identifiers } from "../../ioc";
import { StreamReader, StreamWriter } from "../../filesystem";

@Container.injectable()
export abstract class AbstractWorkerAction implements WorkerAction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    protected table?: string;
    protected codec?: string;
    protected skipCompression?: boolean;
    protected filePath?: string;
    protected genesisBlockId?: string;
    protected updateStep?: number;

    protected options?: Worker.ActionOptions;

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

    public abstract async start();

    public sync(data: any): void {}

    protected getRepository(): Repository {
        let repositoryFactory = this.app.get<RepositoryFactory>(Identifiers.SnapshotRepositoryFactory);

        return repositoryFactory(this.table!);
    }

    protected getStreamReader(): StreamReader {
        let streamReaderFactory = this.app.get<Stream.StreamReaderFactory>(Identifiers.StreamReaderFactory);

        return streamReaderFactory(this.filePath!, !this.skipCompression!, this.getCodec()[`${this.table}Decode`])
    }

    protected getStreamWriter(dbStream: NodeJS.ReadableStream): StreamWriter {
        let streamWriterFactory = this.app.get<Stream.StreamWriterFactory>(Identifiers.StreamWriterFactory);

        return streamWriterFactory(dbStream, this.filePath!, !this.skipCompression!, this.getCodec()[`${this.table}Encode`])
    }

    protected applyGenesisBlockFix(block: Models.Block): void {
        if (block.height === 1) {
            block.id = this.genesisBlockId!;
        }
    }

    protected getCodec(): Codec {
        return this.app.getTagged<Codec>(Identifiers.SnapshotCodec, "codec", this.codec);
    }
}
