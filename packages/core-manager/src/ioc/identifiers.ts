export const Identifiers = {
    HTTP: Symbol.for("ManagerAPI<HTTP"),
    HTTPS: Symbol.for("ManagerAPI<HTTPS>"),
    HTTP_JSON_RPC: Symbol.for("ManagerAPI<HTTP_JSON_RPC>"),
    HTTPS_JSON_RPC: Symbol.for("ManagerAPI<HTTPS_JSON_RPC>"),
    CLI: Symbol.for("Application<Cli>"),
    ActionReader: Symbol.for("Discover<Action>"),
    PluginFactory: Symbol.for("Factory<Plugin>"),
    BasicCredentialsValidator: Symbol.for("Validator<BasicCreadentials>"),
    TokenValidator: Symbol.for("Validator<Token>"),
    SnapshotsManager: Symbol.for("Manager<Snapshots>"),
    CliManager: Symbol.for("Manager<Cli>"),

    WatcherDatabaseService: Symbol.for("Watcher<DatabaseService>"),
    LogsDatabaseService: Symbol.for("Logs<DatabaseService>"),
    EventsListener: Symbol.for("Listener<Events>"),
    WorkerManager: Symbol.for("Manager<Worker>"),
};
