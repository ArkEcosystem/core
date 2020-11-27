import { Container } from "@arkecosystem/core-kernel";
import si from "systeminformation";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.resources";

    public async execute(params: any): Promise<any> {
        return {
            cpu: await this.prepareCpuData(),
            ram: await this.prepareMemData(),
            disks: await this.prepareFilesystemsData(),
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
        const fs = await si.fsSize();

        const result: any[] = [];

        for (const disk of fs) {
            result.push({
                filesystem: disk.fs,
                total: this.convert(disk.size),
                used: this.convert(disk.used),
                available: this.convert(disk.size - disk.used),
                mountpoint: disk.mount,
            });
        }

        return result;
    }

    private convert(sizeInBytes: number): number {
        return sizeInBytes / 1024;
    }
}
