import { Index } from "./base";
export declare class Wallets extends Index {
    index(): Promise<void>;
    listen(): void;
    protected countWithDatabase(): Promise<number>;
}
