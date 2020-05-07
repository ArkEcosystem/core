import argon2 from "argon2"

import { Container } from "@arkecosystem/core-kernel";
import { Actions } from "../contracts"

@Container.injectable()
export class Action implements Actions.Action {
    public name = "argon2id";

    public schema = {
        type: "object",
        properties: {
            hash: {
                type: "string"
            },
            password: {
                type: "string"
            }
        },
        required: ["hash", "password"],
    }

    public async method(params: { hash: string, password: string }): Promise<any> {

        // @ts-ignore
        let options = {
            // salt: Buffer.from(params.hash),
            secret: Buffer.from("secret"),
            type: argon2.argon2id
        }

        let hashedPassword = await argon2.hash(params.password, options)

        return {
            hash: params.hash,
            password: params.password,
            hashedPassword: hashedPassword.toString(),
            isVerified: await argon2.verify(hashedPassword, params.password, options),
            isNotVerified: await argon2.verify(hashedPassword, params.password + "a", options),
        }
    }
}
