import "jest-extended";

import { parse } from "path";
import tg from "tiny-glob/sync";

const entries = tg("../../../../packages/crypto/src/networks/**/*.json", { cwd: __dirname });

const NETWORKS = {};
entries.forEach((file) => {
    NETWORKS[parse(file).name] = require(file);
});

const NETWORKS_LIST = [];
entries.forEach((file) => NETWORKS_LIST.push(require(file)));

module.exports = { NETWORKS, NETWORKS_LIST };
