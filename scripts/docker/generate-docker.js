const fs = require("fs");
const { ensureDirSync } = require("fs-extra");

const regex = new RegExp("{token}", "g");
const templateRoot = './scripts/docker/templates'
const templateDirs = fs.readdirSync(templateRoot);

if (process.argv.length !== 3) {
    throw new Error("Expected 1 argument for the token name");
}

const token = process.argv[2];

console.log(`Generating docker files for '${token}':`)

templateDirs.forEach(templateDir => {
    ensureDirSync(`./docker/development/${templateDir}`)
    const templateFiles = fs.readdirSync(`${templateRoot}/${templateDir}`)
    templateFiles.forEach(templateFile => {
        const template = fs.readFileSync(`${templateRoot}/${templateDir}/${templateFile}`, { encoding: "utf8" })
        const target = `./docker/development/${templateDir}/${templateFile}`
        console.log(`${target}`)
        fs.writeFileSync(target, template.replace(regex, token));
        if (templateFile.endsWith(".sh")) {
            fs.chmodSync(target, "755");
        }
    })
})
