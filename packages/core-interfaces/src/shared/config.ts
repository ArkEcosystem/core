import { get, set } from "@arkecosystem/utils";

export class Config {
    private config: any;

    public init(options: any): void {
        this.config = options;
    }

    public get(key: string, defaultValue: any = null): any {
        return get(this.config, key, defaultValue);
    }

    public set(key: string, value: any): void {
        set(this.config, key, value);
    }
}
