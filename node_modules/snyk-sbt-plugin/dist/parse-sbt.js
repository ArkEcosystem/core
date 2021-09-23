"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tabdown = require('./tabdown');
function convertStrToTree(dependenciesTextTree) {
    const lines = dependenciesTextTree.toString().split('\n') || [];
    const newLines = lines
        .map((line) => {
        return line.replace(/\u001b\[0m/g, '');
    })
        .filter((line) => {
        if (line.indexOf('[info] ') === 0 && line.indexOf('+-') > -1) {
            return true;
        }
        let match = line.match(/\[info\]\s[\w_\.\-]+:[\w_\.\-]+:[\w_\.\-]+/);
        if (match && match[0].length === line.length) {
            return true;
        }
        match = line.match(/\[info\]\s[\w_\.\-]+:[\w_\.\-]+:[\w_\.\-]+\s\[S\]/);
        if (match && match[0].length === line.length) {
            return true;
        }
        return false;
    })
        .map((line) => {
        return line
            .slice(7, line.length) // slice off '[info] '
            .replace(' [S]', '')
            .replace(/\|/g, ' ')
            .replace('+-', '')
            .replace(/\s\s/g, '\t');
    });
    const tree = tabdown.parse(newLines, '\t');
    return tree;
}
function convertCoursierStrToTree(dependenciesTextTree) {
    const lines = dependenciesTextTree.toString().split('\n') || [];
    const newLines = lines
        .map((line) => {
        return line.replace(/\u001b\[0m/g, '');
    })
        .filter((line) => {
        if (line.match(/[│├└].*/)) {
            return true;
        }
        if (line.match(/[^\s]+\s\(configurations.*/)) {
            return true;
        }
        return false;
    })
        .map((line) => {
        return line
            .replace(/\│/g, ' ')
            .replace('├─ ', '   ')
            .replace('└─ ', '   ')
            .replace(/\s\s\s/g, '\t');
    });
    const tree = tabdown.parse(newLines, '\t');
    return tree;
}
function walkInTree(toNode, fromNode) {
    if (fromNode.children && fromNode.children.length > 0) {
        for (const j of Object.keys(fromNode.children)) {
            const externalNode = getPackageNameAndVersion(fromNode.children[j].data);
            if (externalNode) {
                const newNode = {
                    version: externalNode.version,
                    name: externalNode.name,
                    dependencies: [],
                };
                toNode.dependencies.push(newNode);
                walkInTree(toNode.dependencies[toNode.dependencies.length - 1], fromNode.children[j]);
            }
        }
    }
    delete toNode.parent;
}
function getPackageNameAndVersion(packageDependency) {
    let splited;
    let version;
    let app;
    if (packageDependency.indexOf('(evicted by:') > -1) {
        return null;
    }
    if (packageDependency.indexOf('->') > -1) {
        return null;
    }
    splited = packageDependency.split(':');
    version = splited[splited.length - 1];
    app = splited[0] + ':' + splited[1];
    app = app.split('\t').join('');
    app = app.trim();
    version = version.trim();
    return { name: app, version };
}
function convertDepArrayToObject(depsArr) {
    if (!depsArr) {
        return null;
    }
    return depsArr.reduce((acc, dep) => {
        dep.dependencies = convertDepArrayToObject(dep.dependencies);
        acc[dep.name] = dep;
        return acc;
    }, {});
}
function createSnykTree(rootTree, name, version) {
    let snykTree;
    let appTree;
    if (rootTree.root.length === 1) {
        // single build configuration
        // - use parsed package name and version
        // - use single project as root
        appTree = rootTree.root[0];
        snykTree = getPackageNameAndVersion(Object.keys(appTree).pop());
        snykTree.dependencies = [];
    }
    else {
        // multi build configuration
        // - use provided package name and version
        // - use complete tree as root
        appTree = rootTree;
        snykTree = {
            multiBuild: true,
            name,
            version,
            dependencies: [],
        };
    }
    walkInTree(snykTree, appTree);
    snykTree.dependencies = convertDepArrayToObject(snykTree.dependencies);
    return snykTree;
}
function getProjectName(root) {
    const app = root.split(' ')[0].trim();
    return { name: app };
}
function createCoursierSnykTree(rootTree, name, version) {
    let snykTree;
    if (rootTree.root.length === 1) {
        // single build configuration
        // - use parsed package name - we don't have version in output
        // - use single project as root
        const appTree = rootTree.root[0];
        snykTree = getProjectName(Object.keys(appTree).pop());
        snykTree.dependencies = [];
        walkInTree(snykTree, appTree);
    }
    else {
        // multi build configuration
        // - use provided package name and version
        // - use complete tree as root
        const dependencies = rootTree.root.map((appTree) => {
            const subTree = getProjectName(Object.keys(appTree).pop());
            subTree.dependencies = [];
            walkInTree(subTree, appTree);
            return subTree;
        });
        snykTree = {
            multiBuild: true,
            name,
            version,
            dependencies,
        };
    }
    snykTree.dependencies = convertDepArrayToObject(snykTree.dependencies);
    return snykTree;
}
function parse(text, name, version, isCoursier) {
    if (isCoursier) {
        const coursierRootTree = convertCoursierStrToTree(text);
        return createCoursierSnykTree(coursierRootTree, name, version);
    }
    const rootTree = convertStrToTree(text);
    return createSnykTree(rootTree, name, version);
}
exports.parse = parse;
function parseSbtPluginResults(sbtOutput, packageName, packageVersion) {
    // remove all other output
    const outputStart = 'Snyk Output Start';
    const outputEnd = 'Snyk Output End';
    const sbtProjectOutput = sbtOutput.substring(sbtOutput.indexOf(outputStart) + outputStart.length, sbtOutput.indexOf(outputEnd));
    const sbtOutputJson = JSON.parse(sbtProjectOutput);
    if (Object.keys(sbtOutputJson).length === 1) {
        const project = Object.keys(sbtOutputJson)[0];
        return parseSbtPluginProjectResultToDepTree(project, sbtOutputJson[project]);
    }
    const depTree = {
        name: packageName,
        version: packageVersion,
        dependencies: {},
    };
    // iterating over different project
    for (const project of Object.keys(sbtOutputJson)) {
        depTree.dependencies[project] = parseSbtPluginProjectResultToDepTree(project, sbtOutputJson[project]);
    }
    return depTree;
}
exports.parseSbtPluginResults = parseSbtPluginResults;
function parseSbtPluginProjectResultToDepTree(projectKey, sbtProjectOutput) {
    const pkgs = Object.keys(sbtProjectOutput.modules)
        .filter((module) => {
        // filtering for the `compile` configuration only, otherwise, there can be multiple graph roots
        return sbtProjectOutput.modules[module].configurations.includes('compile');
    });
    const getDependenciesFor = (name) => {
        if (!sbtProjectOutput.dependencies[name]) {
            return {
                name,
                version: sbtProjectOutput.modules[name].version,
            };
        }
        const dependencies = {};
        for (const subDepName of sbtProjectOutput.dependencies[name]) {
            if (pkgs.indexOf(subDepName) > -1) { // dependency is in compile configuration
                dependencies[subDepName] = getDependenciesFor(subDepName);
            }
        }
        return {
            name,
            version: sbtProjectOutput.modules[name].version,
            dependencies,
        };
    };
    return getDependenciesFor(projectKey);
}
//# sourceMappingURL=parse-sbt.js.map