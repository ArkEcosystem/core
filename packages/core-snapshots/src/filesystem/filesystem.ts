import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import { Meta } from "../contracts";

@Container.injectable()
export class Filesystem {
    @Container.inject(Container.Identifiers.FilesystemService)
    private readonly filesystem!: Contracts.Kernel.Filesystem;

    private snapshot?: string;

    public setSnapshot(snapshot: string): void {
        this.snapshot = snapshot;
    }

    public getSnapshotPath(): string {
        Utils.assert.defined<string>(this.snapshot);

        return `${process.env.CORE_PATH_DATA}/snapshots/${this.snapshot}/`;
    }

    public async deleteSnapshot(): Promise<void> {
        await this.filesystem.delete(this.getSnapshotPath());
    }

    public async snapshotExists(): Promise<boolean> {
        return this.filesystem.exists(this.getSnapshotPath());
    }

    public async prepareDir(): Promise<void> {
        await this.filesystem.makeDirectory(this.getSnapshotPath());
    }

    public async writeMetaData(meta: Meta.MetaData): Promise<void> {
        await this.filesystem.put(`${this.getSnapshotPath()}meta.json`, JSON.stringify(meta));
    }

    public async readMetaData(): Promise<Meta.MetaData> {
        const buffer = await this.filesystem.get(`${this.getSnapshotPath()}meta.json`);

        const meta = JSON.parse(buffer.toString());

        this.validateMetaData(meta);

        return meta;
    }

    private validateMetaData(meta: Meta.MetaData): void {
        Utils.assert.defined(meta.codec);
        Utils.assert.defined(meta.skipCompression);

        Utils.assert.defined(meta.blocks?.count);
        Utils.assert.defined(meta.transactions?.count);
        Utils.assert.defined(meta.rounds?.count);
    }
}
