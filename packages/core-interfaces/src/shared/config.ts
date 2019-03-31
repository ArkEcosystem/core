import get from "lodash.get";
import set from "lodash.set";

export class Config {
    private config: any;

    public init(options: any): void {
        this.config = options;
    }

    public get<T = any>(key: string, defaultValue: any = null): T {
        return get(this.config, key, defaultValue);
    }

    public set<T = any>(key: string, value: T): void {
        set(this.config, key, value);
    }
}
