export interface AnalyzerPkg {
  Name: string;
  Version?: string;
  Source?: string;
  Provides: string[];
  Deps: {
    [name: string]: any;
  };
  AutoInstalled?: boolean;
}

export interface OSRelease {
  name: string;
  version: string;
}

export interface Binary {
  name: string;
  version: string;
}
