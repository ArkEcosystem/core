import { Source } from "./contracts";
import { InvalidPackageJson, AlreadyInstalled } from "./errors";
import { ensureDirSync, readJSONSync, existsSync, moveSync, removeSync } from "fs-extra";
import execa from "execa";
import { join } from "path";

export abstract class AbstractSource implements Source {
    protected readonly dataPath: string;
    protected readonly tempPath: string;

    protected constructor({ data, temp }: { data: string; temp: string }) {
        this.dataPath = data;
        this.tempPath = temp;

        ensureDirSync(this.dataPath);
    }

    public async install(value: string): Promise<void> {
        const origin = this.getOriginPath();

        removeSync(origin);

        await this.preparePackage(value);

        const packageName = this.getPackageName(origin);
        this.throwIfAlreadyInstalled(packageName);

        moveSync(origin, this.getDestPath(packageName));

        execa.sync(`yarn`, ["install"], { cwd: this.getDestPath(packageName) });

        removeSync(origin);
    }

    // TODO: Remove
    protected async installDependencies(path: string): Promise<void> {
        execa.sync(`yarn`, ["install"], { cwd: path });
    }

    protected getOriginPath(): string {
        return join(this.tempPath, "package")
    }

    protected getDestPath(packageName: string): string {
        return join(this.dataPath, packageName);
    }

    protected getPackageName(path: string): string {
        try {
            return readJSONSync(join(path, "package.json")).name
        } catch {
            throw new InvalidPackageJson()
        }
    }

    private throwIfAlreadyInstalled(packageName: string): void {
        if(existsSync(this.getDestPath(packageName))) {
            throw new AlreadyInstalled(packageName);
        }
    }

    public abstract async exists(value: string): Promise<boolean>;

    public abstract async update(value: string): Promise<void>;

    protected abstract async preparePackage(value: string): Promise<void>;
}
