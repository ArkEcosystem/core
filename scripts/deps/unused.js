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
        const dependencies = Object.values(unused.dependencies);
        const devDependencies = Object.values(unused.devDependencies);

        if (dependencies || devDependencies) {
            console.log(`[FAIL] ${pkg}`)

            if (dependencies.length > 0) {
                for (const dep of dependencies) {
                    console.log(`[PRO] ${dep}`)
                }
            }

            if (devDependencies.length > 0) {
                for (const dep of devDependencies) {
                    console.log(`[DEV] ${dep}`)
                }
            }
        } else {
            console.log(`[PASS] ${pkg}`)
        }
    });
}
