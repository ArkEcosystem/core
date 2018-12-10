import { app } from "@arkecosystem/core-container";
import { createHash } from "crypto";

function getCacheTimeout() {
    const { generateTimeout } = app.resolveOptions("api").cache;

    return JSON.parse(generateTimeout);
}

function generateCacheKey(value) {
    return createHash("sha256")
        .update(JSON.stringify(value))
        .digest("hex");
}

export { getCacheTimeout, generateCacheKey };
