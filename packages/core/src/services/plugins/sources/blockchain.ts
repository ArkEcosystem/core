import { Paths } from "env-paths";

import { Source } from "./contracts";

export class Blockchain implements Source {
    // @ts-ignore
    private readonly dataPath: string;

    public constructor(private readonly paths: Paths) {
        this.dataPath = `${this.paths.data}/plugins`;
    }

    public async exists(value: string): Promise<boolean> {
        return false;
    }

    public async install(value: string): Promise<void> {
        //
    }

    public async update(value: string): Promise<void> {
        //
    }
}
