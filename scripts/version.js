const glob = require("glob");
const { join } = require("path");
const { readFileSync, writeFileSync } = require("fs");

const version = process.argv[2];
const cwd = join(__dirname, "../packages");

if (!version) {
    console.error("Specify version.");
    return;
}

const packagePaths = glob.sync("*/package.json", { cwd });

for (const packagePath of packagePaths) {
    const packageJson = JSON.parse(readFileSync(join(cwd, packagePath)));
    packageJson.version = version;

    writeFileSync(join(cwd, packagePath), JSON.stringify(packageJson, null, "    "));
}
