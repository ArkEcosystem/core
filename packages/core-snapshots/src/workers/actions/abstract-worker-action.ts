import fs from "fs-extra";
import zlib from "zlib";
import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Codec, WorkerAction, Repository } from "../../contracts";
import { Identifiers } from "../../ioc";
import {
    BlockRepository,
    RoundRepository,
    TransactionRepository,
} from "../../repositories";
import { Managers } from "@arkecosystem/crypto";


@Container.injectable()
export abstract class AbstractWorkerAction implements WorkerAction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    // @ts-ignore
    private readonly snapshotBlockRepository!: BlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    // @ts-ignore
    private readonly snapshotRoundRepository!: RoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    // @ts-ignore
    private readonly snapshotTransactionRepository!: TransactionRepository;

    protected table?: string;
    protected codec?: string;
    protected skipCompression?: boolean;
    protected trace?: boolean;
    protected filePath?: string;
    protected genesisBlockId?: string;
    protected updateStep?: number;

    public init(options: any) {
        this.table = options.table;
        this.codec = options.codec;
        this.skipCompression = options.skipCompression;
        this.trace = options.trace;
        this.filePath = options.filePath;
        this.genesisBlockId = options.genesisBlockId;
        this.updateStep = options.updateStep;

        Managers.configManager.setFromPreset(options.network);
    }

    public abstract async start();

    public sync(data: any): void {}

    protected getWriteStream(databaseStream: NodeJS.ReadableStream): NodeJS.WritableStream {
        const snapshotWriteStream = fs.createWriteStream(this.filePath!, {});
        const encodeStream = this.getCodec().createEncodeStream(this.table!);
        const gzipStream = zlib.createGzip();

        let stream: NodeJS.ReadableStream = databaseStream;

        stream = stream.pipe(encodeStream);

        if (!this.skipCompression) {
            stream = stream.pipe(gzipStream);
        }

        return stream.pipe(snapshotWriteStream);
    }

    protected getReadStream(): NodeJS.ReadableStream {
        const readStream = fs.createReadStream(this.filePath!, {});
        const gunzipStream = zlib.createGunzip();
        const decodeStream = this.getCodec().createDecodeStream(this.table!);

        let stream: NodeJS.ReadableStream = readStream;

        if (!this.skipCompression) {
            stream = stream.pipe(gunzipStream);
        }

        return stream.pipe(decodeStream);
    }

    protected getRepository(): Repository {
        switch (this.table) {
            case "blocks":
                return this.snapshotBlockRepository;
            case "transactions":
                return this.snapshotTransactionRepository;
            case "rounds":
                return this.snapshotRoundRepository;
            default:
                throw new Error();
        }
    }

    protected applyGenesisBlockFix(block: Models.Block): void {
        if (block.height === 1) {
            block.id = this.genesisBlockId!;
        }
    }

    private getCodec(): Codec {
        return this.app.getTagged<Codec>(Identifiers.SnapshotCodec, "codec", this.codec);
    }
}
