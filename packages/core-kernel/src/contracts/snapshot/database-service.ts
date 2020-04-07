// import { Interfaces } from "@packages/crypto";

export interface DatabaseService {
    truncate(): Promise<void>;
    // getLastBlock():  Promise<Interfaces.IBlock | undefined>
}
