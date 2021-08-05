import { Source } from "./contracts";
import { ensureDirSync } from "fs-extra";

export abstract class AbstractSource implements Source {
    protected readonly dataPath: string;
    protected readonly tempPath?: string;

    protected constructor({ data, temp }: { data: string; temp?: string }) {
        this.dataPath = data;
        this.tempPath = temp;

        ensureDirSync(this.dataPath);
    }

    abstract async exists(value: string): Promise<boolean>;

    abstract async install(value: string): Promise<void>;

    abstract async update(value: string): Promise<void>;
}
