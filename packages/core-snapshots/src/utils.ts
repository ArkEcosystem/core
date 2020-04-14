import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Meta } from "./contracts";

@Container.injectable()
export class Utils {
    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    private network: string = "";
    private snapshot: string = "";

    public setNetwork(network: string): void {
        this.network = network;
    }

    public setSnapshot(snapshot: string): void {
        this.snapshot = snapshot;
    }

    public async snapshotExists(): Promise<boolean> {
        return this.filesystem.exists(this.getSnapshotFolderPath());
    }

    public getSnapshotFolderPath(): string {
        return `${process.env.CORE_PATH_DATA}/snapshots/${this.network}/${this.snapshot}/`
    }

    public async prepareDir(): Promise<void> {
        await this.filesystem.makeDirectory(this.getSnapshotFolderPath());
    }

    public async writeMetaData(meta: any): Promise<void> {
        await this.filesystem.put(`${this.getSnapshotFolderPath()}meta.json`, JSON.stringify(meta));
    }

    public async readMetaData(): Promise<Meta.MetaData> {
        let buffer = await this.filesystem.get(`${this.getSnapshotFolderPath()}meta.json`);

        let meta = JSON.parse(buffer.toString());

        this.validateMetaData(meta);

        return meta;
    }

    public validateMetaData(meta: Meta.MetaData): boolean {
        return true;
    }
}
