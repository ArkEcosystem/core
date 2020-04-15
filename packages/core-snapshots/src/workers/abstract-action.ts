import fs from "fs-extra";
import zlib from "zlib";
import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Codec } from "../contracts";
import { Identifiers } from "../ioc";
import {
    SnapshotBlockRepository,
    SnapshotRoundRepository,
    SnapshotTransactionRepository,
} from "../repositories";

@Container.injectable()
export abstract class AbstractWorkerAction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    // @ts-ignore
    private readonly snapshotBlockRepository!: SnapshotBlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    // @ts-ignore
    private readonly snapshotRoundRepository!: SnapshotRoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    // @ts-ignore
    private readonly snapshotTransactionRepository!: SnapshotTransactionRepository;

    protected table?: string;
    protected codec?: string;
    protected skipCompression?: boolean;
    protected trace?: boolean;
    protected filePath?: string;
    protected genesisBlockId?: string;

    public init(options: any) {
        this.table = options.table;
        this.codec = options.codec;
        this.skipCompression = options.skipCompression;
        this.trace = options.trace;
        this.filePath = options.filePath;
        this.genesisBlockId = options.genesisBlockId;
    }

    public abstract async start();

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

    protected getRepository(): Repositories.AbstractEntityRepository<any> {
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
