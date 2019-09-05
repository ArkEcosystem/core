import { CLIError } from "@oclif/errors";

export const abort = (message: string): void => {
    throw new CLIError(message);
};
