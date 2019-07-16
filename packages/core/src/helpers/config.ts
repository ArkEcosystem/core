import { ensureFileSync, readJsonSync, removeSync, writeJsonSync } from "fs-extra";
import { getRegistryChannel } from "./update";

class ConfigManager {
    private config;
    private file: string;

    public setup(config: Record<string, any>) {
        this.config = config;
        this.file = `${config.configDir}/config.json`;

        this.ensureDefaults();
    }

    public get(key: string): string {
        return this.read()[key];
    }

    public set(key: string, value: string): void {
        this.update({ [key]: value });
    }

    public has(key: string): boolean {
        return !!this.get(key);
    }

    public update(data: Record<string, string>): void {
        this.write({ ...this.read(), ...data });
    }

    private ensureDefaults(): void {
        if (!this.read()) {
            removeSync(this.file);

            ensureFileSync(this.file);

            this.write({
                token: this.config.bin,
                channel: getRegistryChannel(this.config),
                updateMethod: "npm",
            });
        }

        if (!this.has("updateMethod")) {
            this.set("updateMethod", "npm");
        }
    }

    private read(): any {
        try {
            return readJsonSync(this.file);
        } catch (error) {
            return false;
        }
    }

    private write(data): void {
        writeJsonSync(this.file, data);
    }
}

export const configManager = new ConfigManager();
