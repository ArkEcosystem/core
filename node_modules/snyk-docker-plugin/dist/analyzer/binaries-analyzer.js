"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
function analyze(targetImage, installedPackages, pkgManager, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const binaries = yield getBinaries(targetImage, installedPackages, pkgManager, options);
        return {
            Image: targetImage,
            AnalyzeType: "binaries",
            Analysis: binaries,
        };
    });
}
exports.analyze = analyze;
const binaryVersionExtractors = {
    node: require("./binary-version-extractors/node"),
    openjdk: require("./binary-version-extractors/openjdk-jre"),
};
function getBinaries(targetImage, installedPackages, pkgManager, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const binaries = [];
        for (const versionExtractor of Object.keys(binaryVersionExtractors)) {
            const extractor = binaryVersionExtractors[versionExtractor];
            if (extractor.installedByPackageManager(installedPackages, pkgManager, options)) {
                continue;
            }
            const binary = yield extractor.extract(targetImage, options);
            if (binary) {
                binaries.push(binary);
            }
        }
        return binaries;
    });
}
//# sourceMappingURL=binaries-analyzer.js.map