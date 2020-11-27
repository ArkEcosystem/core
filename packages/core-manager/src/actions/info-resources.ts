import { Container } from "@arkecosystem/core-kernel";
import df from "@sindresorhus/df";
import si from "systeminformation";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.resources";

    public async execute(params: any): Promise<any> {
        return {
            cpu: await this.prepareCpuData(),
            ram: await this.prepareMemData(),
            disk: await this.prepareFilesystemsData(),
        };
    }

    private async prepareCpuData(): Promise<any> {
        const cpuLoad = await si.currentLoad();

        return {
            total: 100,
            used: cpuLoad.currentload,
            available: 100 - cpuLoad.currentload,
        };
    }

    private async prepareMemData(): Promise<any> {
        const mem = await si.mem();

        return {
            total: this.convert(mem.total),
            used: this.convert(mem.used),
            available: this.convert(mem.free),
        };
    }

    private async prepareFilesystemsData(): Promise<any> {
        const projectFs = await this.getProjectFilesystem();

        const disk: any = (await si.fsSize()).find((disk) => disk.fs === projectFs);

        return {
            filesystem: disk.fs,
            total: this.convert(disk.size),
            used: this.convert(disk.used),
            available: this.convert(disk.size - disk.used),
            mountpoint: disk.mount,
        };
    }

    private async getProjectFilesystem(): Promise<string> {
        return (await df.file(__dirname)).filesystem;
    }

    private convert(sizeInBytes: number): number {
        return sizeInBytes / 1024;
    }
}
