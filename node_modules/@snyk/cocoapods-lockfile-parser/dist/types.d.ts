export interface NodeInfoLabels {
    [key: string]: string | undefined;
    checksum: string;
    repository?: string;
    externalSourcePodspec?: string;
    externalSourcePath?: string;
    externalSourceGit?: string;
    externalSourceTag?: string;
    externalSourceCommit?: string;
    externalSourceBranch?: string;
    checkoutOptionsPodspec?: string;
    checkoutOptionsPath?: string;
    checkoutOptionsGit?: string;
    checkoutOptionsTag?: string;
    checkoutOptionsCommit?: string;
    checkoutOptionsBranch?: string;
}
export interface Lockfile {
    PODS: PodEntry[];
    DEPENDENCIES: string[];
    'SPEC REPOS'?: {
        [key: string]: string[];
    };
    'EXTERNAL SOURCES'?: {
        [key: string]: ExternalSourceInfo;
    };
    'CHECKOUT OPTIONS'?: {
        [key: string]: CheckoutOptions;
    };
    'SPEC CHECKSUMS': {
        [key: string]: string;
    };
    'PODFILE CHECKSUM'?: string;
    COCOAPODS?: string;
}
declare type PodEntry = string | {
    [key: string]: string[];
};
export declare type ExternalSourceInfoKey = ':podspec' | ':path' | ':git' | ':tag' | ':commit' | ':branch';
export declare type ExternalSourceInfo = {
    [K in ExternalSourceInfoKey]?: string;
};
export declare type CheckoutOptionKey = ExternalSourceInfoKey;
export declare type CheckoutOptions = {
    [K in CheckoutOptionKey]?: string;
};
export {};
