import "jest-extended";
import tg from "tiny-glob/sync";
import { parse } from "path";

const entries = tg("../../lib/networks/**/*.json", { cwd: __dirname });

const NETWORKS = {};
entries.forEach(file => {
  NETWORKS[parse(file).name] = require(file);
});

const NETWORKS_LIST = [];
entries.forEach(file => NETWORKS_LIST.push(require(file)));

module.exports = { NETWORKS, NETWORKS_LIST };
