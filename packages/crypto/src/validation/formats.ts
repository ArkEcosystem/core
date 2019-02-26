import { Ajv } from "ajv";
import { maxVendorFieldLength } from "../utils";

const vendorField = (ajv: Ajv) => {
    ajv.addFormat("vendorField", data => {
        try {
            return Buffer.from(data, "utf8").length <= maxVendorFieldLength();
        } catch {
            return false;
        }
    });
};

const vendorFieldHex = (ajv: Ajv) => {
    ajv.addFormat("vendorFieldHex", data => {
        try {
            if (/^[0123456789A-Fa-f]+$/.test(data)) {
                return Buffer.from(data, "hex").length <= maxVendorFieldLength();
            }
        } catch {
            return false;
        }

        return false;
    });
};

export const formats = [vendorField, vendorFieldHex];
