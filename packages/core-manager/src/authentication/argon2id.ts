import { Authentication } from "../contracts";

export class Argon2id implements Authentication.BasicAuthentication {
    public async validate(username: string, password: string): Promise<boolean> {
        return true;
    }
}
