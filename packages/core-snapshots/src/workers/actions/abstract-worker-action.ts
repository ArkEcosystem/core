import { Blocks, CryptoSuite } from "@arkecosystem/core-crypto";
import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import pluralize from "pluralize";
import { pascalize } from "xcase";

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

    private verifier!: Verifier;

    public init(options: Worker.ActionOptions) {
        this.table = options.table;
        this.codec = options.codec;
        this.skipCompression = options.skipCompression;
        this.filePath = options.filePath;
        this.genesisBlockId = options.genesisBlockId;
        this.updateStep = options.updateStep;

        this.options = options;

        const cryptoManager: CryptoSuite.CryptoManager = this.app.get(Container.Identifiers.CryptoManager);
        const transactionManager: CryptoSuite.TransactionManager = this.app.get(
            Container.Identifiers.TransactionManager,
        );
        const blockFactory: Blocks.BlockFactory = this.app.get(Container.Identifiers.BlockFactory);

        this.verifier = new Verifier(cryptoManager, transactionManager, blockFactory);
    }

    protected getRepository(): Repository {
        const repositoryFactory = this.app.get<RepositoryFactory>(Identifiers.SnapshotRepositoryFactory);

        return repositoryFactory(this.table!);
    }

    protected getSingularCapitalizedTableName() {
        return pascalize(pluralize.singular(this.table));
    }

    protected getStreamReader(): StreamReader {
        const streamReaderFactory = this.app.get<Stream.StreamReaderFactory>(Identifiers.StreamReaderFactory);

        // passing a codec method as last parameter. Example: Codec.decodeBlock
        return streamReaderFactory(
            this.filePath!,
            !this.skipCompression!,
            this.getCodec()[`decode${this.getSingularCapitalizedTableName()}`].bind(this.getCodec()), // TODO:
        );
    }

    protected getStreamWriter(dbStream: NodeJS.ReadableStream): StreamWriter {
        const streamWriterFactory = this.app.get<Stream.StreamWriterFactory>(Identifiers.StreamWriterFactory);

        // passing a codec method as last parameter. Example: Codec.decodeBlock
        return streamWriterFactory(
            dbStream,
            this.filePath!,
            !this.skipCompression!,
            this.getCodec()[`encode${this.getSingularCapitalizedTableName()}`].bind(this.getCodec()), // TODO:,
        );
    }

    protected getCodec(): Codec {
        return this.app.getTagged<Codec>(Identifiers.SnapshotCodec, "codec", this.codec);
    }

    protected getVerifyFunction(): Function {
        // passing a codec method as last parameter. Example: Verifier.verifyBlock
        return this.verifier[`verify${this.getSingularCapitalizedTableName()}`].bind(this.verifier);
    }

    protected applyGenesisBlockFix(block: Models.Block): void {
        if (block.height === 1) {
            block.id = this.genesisBlockId!;
        }
    }

    public abstract async start();

    public abstract sync(data: any);
}
