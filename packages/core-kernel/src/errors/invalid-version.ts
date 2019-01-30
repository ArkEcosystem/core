import { ExtendableError } from "./custom-error";

export class InvalidVersion extends ExtendableError {
    constructor(version: string) {
        super(
            `"${version}" is not a valid semantic version. Please check https://semver.org/ and make sure you follow the spec.`,
        );
    }
}
