import { Types } from "@arkecosystem/core-kernel";
import { ExecaSyncReturnValue } from "execa";

export const parseProcessActionResponse = (response: ExecaSyncReturnValue): Types.JsonObject => {
    const responseLines = response.stdout.split("\n");

    if (responseLines.length >= 2) {
        const response = responseLines[1].substring(responseLines[1].indexOf("=") + 1);

        const parsedResponse = JSON.parse(response);

        if (!parsedResponse.response && !parsedResponse.error) {
            throw new Error("Invalid process action response");
        }

        return parsedResponse;
    }

    throw new Error("Cannot parse process action response");
};
