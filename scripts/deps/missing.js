const depcheck = require("depcheck");
const {
    resolve
} = require("path");
const {
    lstatSync,
    readdirSync
} = require("fs");

const source = resolve(__dirname, "../../packages");

const pkgs = readdirSync(source)
    .filter(name => lstatSync(`${source}/${name}`).isDirectory())
    .sort();

for (const pkg of pkgs) {
    depcheck(`${source}/${pkg}`, {
        ignoreDirs: [
            '__tests__',
            'benchmark',
            'dist',
            'docker',
            'scripts',
        ],
        ignoreMatches: [
            '@types/*'
        ],
    }, unused => {
        const missing = Object.keys(unused.missing);

        if (missing.length > 0) {
            console.log(`[FAIL] ${pkg}`)

            for (const dep of missing) {
                console.log(`lerna add ${dep} --scope=@arkecosystem/${pkg}`)
            }
        } else {
            console.log(`[PASS] ${pkg}`)
        }
    });
}
