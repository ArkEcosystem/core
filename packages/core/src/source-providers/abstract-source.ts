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

    protected async installInternal(extractedPath: string): Promise<void> {
        try {
            const packageName = this.getPackageName(extractedPath);

            this.throwIfAlreadyInstalled(packageName);

            moveSync(extractedPath, this.getDestPath(packageName));

            execa.sync(`yarn`, ["install"], { cwd: this.getDestPath(packageName) });
        } catch (err) {
            throw err;
        } finally {
            removeSync(extractedPath);
        }
    }

    // TODO: Remove
    protected async installDependencies(path: string): Promise<void> {
        execa.sync(`yarn`, ["install"], { cwd: path });
    }

    private getPackageName(extractedPath: string): string {
        try {
            return readJSONSync(join(extractedPath, "package.json")).name
        } catch {
            throw new InvalidPackageJson()
        }
    }

    private throwIfAlreadyInstalled(packageName: string): void {
        if(existsSync(this.getDestPath(packageName))) {
            throw new AlreadyInstalled(packageName);
        }
    }

    private getDestPath(packageName: string): string {
        return join(this.dataPath, packageName);
    }

    public abstract async exists(value: string): Promise<boolean>;

    public abstract async install(value: string): Promise<void>;

    public abstract async update(value: string): Promise<void>;
}
