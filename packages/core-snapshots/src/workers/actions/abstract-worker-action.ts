import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { Readable } from "stream";
import { pascalize } from "xcase";

import { Codec, Repository, RepositoryFactory, Stream, Worker } from "../../contracts";
import { StreamReader, StreamWriter } from "../../filesystem";
import { Identifiers } from "../../ioc";
import { Verifier } from "../../verifier";

@Container.injectable()
export abstract class AbstractWorkerAction implements Worker.WorkerAction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    protected table?: string;
    protected codec?: string;
    protected skipCompression?: boolean;
    protected filePath?: string;
    protected updateStep?: number;

    protected options?: Worker.ActionOptions;

    public init(options: Worker.ActionOptions): void {
        this.table = options.table;
        this.codec = options.codec;
        this.skipCompression = options.skipCompression;
        this.filePath = options.filePath;
        this.updateStep = options.updateStep;

        this.options = options;
    }

    protected getRepository(): Repository {
        const repositoryFactory = this.app.get<RepositoryFactory>(Identifiers.SnapshotRepositoryFactory);

        return repositoryFactory(this.table!);
    }

    protected getSingularCapitalizedTableName(): string {
        return pascalize(pluralize.singular(this.table));
    }

    protected getStreamReader(): StreamReader {
        const streamReaderFactory = this.app.get<Stream.StreamReaderFactory>(Identifiers.StreamReaderFactory);

        // passing a codec method as last parameter. Example: Codec.decodeBlock
        return streamReaderFactory(
            this.filePath!,
            !this.skipCompression!,
            this.getCodec()[`decode${this.getSingularCapitalizedTableName()}`],
        );
    }

    protected getStreamWriter(dbStream: Readable): StreamWriter {
        const streamWriterFactory = this.app.get<Stream.StreamWriterFactory>(Identifiers.StreamWriterFactory);

        // passing a codec method as last parameter. Example: Codec.decodeBlock
        return streamWriterFactory(
            dbStream,
            this.filePath!,
            !this.skipCompression!,
            this.getCodec()[`encode${this.getSingularCapitalizedTableName()}`],
        );
    }

    protected getCodec(): Codec {
        return this.app.getTagged<Codec>(Identifiers.SnapshotCodec, "codec", this.codec);
    }

    protected getVerifyFunction(): Function {
        // passing a codec method as last parameter. Example: Verifier.verifyBlock
        return Verifier[`verify${this.getSingularCapitalizedTableName()}`];
    }

    protected applyGenesisBlockFix(block: Models.Block): void {
        if (block.height === 1) {
            block.id = Managers.configManager.get<string>("genesisBlock.id")!;
        }
    }

    public abstract start(): Promise<void>;

    public abstract sync(data: Worker.WorkerSyncData): void;
}
