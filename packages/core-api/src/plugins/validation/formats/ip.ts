import * as ip from "ip";

export function registerIpFormat(ajv) {
    ajv.addFormat("ip", {
        type: "string",
        validate: value => ip.isV4Format(value) || ip.isV6Format(value),
    });
}
