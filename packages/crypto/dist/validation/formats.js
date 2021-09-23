"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const vendorField = (ajv) => {
    ajv.addFormat("vendorField", data => {
        try {
            return Buffer.from(data, "utf8").length <= utils_1.maxVendorFieldLength();
        }
        catch (_a) {
            return false;
        }
    });
};
const validPeer = (ajv) => {
    ajv.addFormat("peer", (ip) => {
        try {
            return utils_1.isValidPeer({ ip }, false);
        }
        catch (_a) {
            return false;
        }
    });
};
exports.formats = [vendorField, validPeer];
//# sourceMappingURL=formats.js.map