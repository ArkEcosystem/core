import * as ip from "ip";

export default function(ajv) {
  ajv.addFormat("ip", {
    type: "string",
    validate: (value) => ip.isV4Format(value) || ip.isV6Format(value),
  });
}
