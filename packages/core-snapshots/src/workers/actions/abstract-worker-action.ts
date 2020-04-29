import { Models } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { Codec, WorkerAction, Repository, Worker } from "../../contracts";
import { Identifiers } from "../../ioc";
import {
    BlockRepository,
    RoundRepository,
    TransactionRepository,
} from "../../repositories";

@Container.injectable()
export abstract class AbstractWorkerAction implements WorkerAction {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    private readonly roundRepository!: RoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

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
        switch (this.table) {
            case "blocks":
                return this.blockRepository;
            case "transactions":
                return this.transactionRepository;
            case "rounds":
                return this.roundRepository;
            default:
                throw new Error("Invalid table name");
        }
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
