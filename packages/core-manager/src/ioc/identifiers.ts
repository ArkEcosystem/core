export const Identifiers = {
    HTTP: Symbol.for("API<HTTP>"),
    HTTPS: Symbol.for("API<HTTPS>"),
    CLI: Symbol.for("Application<Cli>"),
    ActionReader: Symbol.for("Discover<Action>"),
    PluginFactory: Symbol.for("Factory<Plugin>"),
    BasicCredentialsValidator: Symbol.for("Validator<BasicCreadentials>"),
    TokenValidator: Symbol.for("Validator<Token>"),
};
