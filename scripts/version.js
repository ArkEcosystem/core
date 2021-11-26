const glob = require("glob");
const { join } = require("path");
const { readJSONSync, writeJsonSync } = require("fs-extra");

const version = process.argv[2];
const cwd = join(__dirname, "../packages");

if (!version) {
    console.error("Specify version.");
    return;
}

const packagePaths = glob.sync("*/package.json", { cwd });

for (const packagePath of packagePaths) {
    const packageJson = readJSONSync(join(cwd, packagePath));
    packageJson.version = version;

    writeJsonSync(join(cwd, packagePath), packageJson, { spaces: "    " });
}
