const chalk = require("chalk");
const madge = require("madge");
const { resolve } = require("path");
const { lstatSync, readdirSync } = require("fs");

const source = resolve(__dirname, "../packages");

const pkgs = readdirSync(source)
    .filter(name => lstatSync(`${source}/${name}`).isDirectory())
    .sort();

for (const pkg of pkgs) {
    const fullPath = `${source}/${pkg}/src`;

    madge(fullPath, {
        fileExtensions: ["ts"],
    }).then(res => {
        const circularDependencies = res.circular();

        if (circularDependencies.length > 0) {
            console.log(
                chalk.bgRed.white.bold(`[${pkg}]: Found ${circularDependencies.length} circular dependencies!`),
            );

            for (let i = 0; i < circularDependencies.length; i++) {
                const tree = [];

                tree.push(chalk.gray(`${i + 1}) `));

                for (let j = 0; j < circularDependencies[i].length; j++) {
                    tree.push(chalk.cyan.bold(circularDependencies[i][j]));

                    if (j !== circularDependencies[i].length - 1) {
                        tree.push(chalk.gray(" > "));
                    }
                }

                console.log(tree.join(""));
            }
        }
    });
}
