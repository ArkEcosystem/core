/**
 * These service providers don't rely on any configuration and are
 * necessary to be available early on during the application lifecycle.
 */
export * from "./register-base-service-providers";

// Foundation
export * from "./register-error-handler";
export * from "./register-base-configuration";
export * from "./register-base-bindings";
export * from "./register-base-namespace";
export * from "./register-base-paths";

// Configuration
export * from "./load-environment-variables";
export * from "./load-configuration";
export * from "./load-cryptography";
// export * from "./watch-configuration";

// Service Providers - Application
export * from "./load-service-providers";
