import { Source } from "./contracts";
import { ensureDirSync } from "fs-extra";
import execa from "execa";

export abstract class AbstractSource implements Source {
    protected readonly dataPath: string;
    protected readonly tempPath: string;

    protected constructor({ data, temp }: { data: string; temp: string }) {
        this.dataPath = data;
        this.tempPath = temp;

        ensureDirSync(this.dataPath);
    }

    protected async installDependencies(path: string): Promise<void> {
        execa.sync(`yarn`, ["install"], { cwd: path });
    }

    public abstract async exists(value: string): Promise<boolean>;

    public abstract async install(value: string): Promise<void>;

    public abstract async update(value: string): Promise<void>;
}
