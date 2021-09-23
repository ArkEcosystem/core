import { GoProjectConfig } from './types';
export declare function parseGoPkgConfig(manifestFileContents: string, lockFileContents: string): GoProjectConfig;
export declare function parseGoVendorConfig(manifestFileContents: string): GoProjectConfig;
export interface DepManifest {
    ignored: string[];
}
export declare function parseGovendorJsonContents(jsonStr: string): GoProjectConfig;
