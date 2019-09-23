import { Validation } from "@arkecosystem/crypto";
import { isValidPeer } from "./is-valid-peer";

export const setupAjvPeerValidation = (validator: Validation.Validator) => {
    validator.addFormat("peer", {
        type: "string",
        validate: (ip: string): boolean => {
            try {
                return isValidPeer({ ip });
            } catch {
                return false;
            }
        },
    });
};
