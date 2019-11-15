import "jest-extended";

import { parse } from "path";
import tg from "tiny-glob/sync";

const entries = tg("../../../../packages/crypto/src/networks/**/*.json", { cwd: __dirname });

const NETWORKS = {};
for (const file of entries) {
    // tslint:disable-next-line
    NETWORKS[parse(file).name] = require(file);
}

const NETWORKS_LIST = [];
for (const file of entries) {
    // tslint:disable-next-line
    NETWORKS_LIST.push(require(file));
}

module.exports = { NETWORKS, NETWORKS_LIST };
