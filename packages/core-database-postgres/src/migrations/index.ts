import { loadQueryFile } from "../utils";
import { readdirSync } from "fs";

export const migrations = readdirSync(__dirname)
    .filter(name => name.substr(-4).toLowerCase() === '.sql')
    .sort()
    .map(name => loadQueryFile(__dirname, name));
