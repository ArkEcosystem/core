import { GoMod, ModuleVersion } from './types';
export declare function parseVersion(versionString: string): ModuleVersion;
export declare function parseGoMod(goModStr: string): GoMod;
export declare function toSnykVersion(v: ModuleVersion): string;
