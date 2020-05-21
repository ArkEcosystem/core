import { Container } from "@arkecosystem/core-kernel";
import argon2 from "argon2";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "support.argon2id";

    public schema = {
        type: "object",
        properties: {
            hash: {
                type: "string",
            },
            password: {
                type: "string",
            },
        },
        required: ["hash", "password"],
    };

    public async execute(params: { hash: string; password: string }): Promise<any> {
        // @ts-ignore
        const options = {
            // salt: Buffer.from(params.hash),
            secret: Buffer.from("secret"),
            type: argon2.argon2id,
        };

        const hashedPassword = await argon2.hash(params.password, options);

        return {
            hash: params.hash,
            password: params.password,
            hashedPassword: hashedPassword.toString(),
            isVerified: await argon2.verify(hashedPassword, params.password, options),
            isNotVerified: await argon2.verify(hashedPassword, params.password, {
                secret: Buffer.from("secret"),
                type: argon2.argon2d,
            }),
            isNotVerified2: await argon2.verify(hashedPassword, params.password + "a", options),
        };
    }
}
