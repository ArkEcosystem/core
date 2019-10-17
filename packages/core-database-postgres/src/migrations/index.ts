import { readdirSync } from "fs";
import { loadQueryFile } from "../utils";

import { loadQueryFile } from "../utils";

export const migrations = readdirSync(__dirname)
    .filter(name => name.substr(-4).toLowerCase() === ".sql")
    .sort()
    .map(name => loadQueryFile(__dirname, name));
