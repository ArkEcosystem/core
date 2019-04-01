import get from "lodash.get";
import set from "lodash.set";

export class Config {
    private config: Record<string, any>;

    public init(options: Record<string, any>): void {
        this.config = options;
    }

    public get<T = any>(key: string, defaultValue: T = null): T {
        return get(this.config, key, defaultValue);
    }

    public set<T = any>(key: string, value: T): void {
        set(this.config, key, value);
    }
}
