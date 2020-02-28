export const Identifiers = {
    // Config
    ConfigFlags: Symbol.for("Config<Flags>"),
    ConfigPlugins: Symbol.for("Config<Plugins>"),
    // Application
    Application: Symbol.for("Application<Instance>"),
    ApplicationDirPrefix: Symbol.for("Application<DirPrefix>"),
    ApplicationEnvironment: Symbol.for("Application<Environment>"),
    ApplicationNamespace: Symbol.for("Application<Namespace>"),
    ApplicationNetwork: Symbol.for("Application<Network>"),
    ApplicationToken: Symbol.for("Application<Token>"),
    ApplicationVersion: Symbol.for("Application<Version>"),
    // Plugins
    PluginConfiguration: Symbol.for("PluginConfiguration"),
    // Crypto
    Crypto: Symbol.for("Crypto<NetworkConfig>"),
    // Managers
    CacheManager: Symbol.for("Manager<Cache>"),
    ConfigManager: Symbol.for("Manager<Config>"),
    DatabaseManager: Symbol.for("Manager<Database>"),
    EventDispatcherManager: Symbol.for("Manager<EventDispatcher>"),
    FilesystemManager: Symbol.for("Manager<Filesystem>"),
    LogManager: Symbol.for("Manager<Log>"),
    QueueManager: Symbol.for("Manager<Queue>"),
    ValidationManager: Symbol.for("Manager<Validation>"),
    // Services
    BlockchainService: Symbol.for("Service<Blockchain>"),
    CacheService: Symbol.for("Service<Cache>"),
    ConfigService: Symbol.for("Service<Config>"),
    DatabaseService: Symbol.for("Service<Database>"),
    EventDispatcherService: Symbol.for("Service<EventDispatcher>"),
    FilesystemService: Symbol.for("Service<Filesystem>"),
    ForgerService: Symbol.for("Service<Forger>"),
    LogService: Symbol.for("Service<Log>"),
    MixinService: Symbol.for("Service<Mixin>"),
    PipelineService: Symbol.for("Service<Pipeline>"),
    QueueService: Symbol.for("Service<Queue>"),
    ScheduleService: Symbol.for("Service<Schedule>"),
    SnapshotService: Symbol.for("Service<Snapshot>"),
    TriggerService: Symbol.for("Service<Actions>"),
    ValidationService: Symbol.for("Service<Validation>"),
    // Factories
    CacheFactory: Symbol.for("Factory<Cache>"),
    PeerFactory: Symbol.for("Factory<Peer>"),
    PipelineFactory: Symbol.for("Factory<Pipeline>"),
    QueueFactory: Symbol.for("Factory<Queue>"),
    // Database
    DatabaseConnection: Symbol.for("Database<Connection>"),
    // Repositories
    WalletRepository: Symbol.for("Repository<Wallet>"),
    WalletRepositoryIndexerIndex: Symbol.for("IndexerIndex<Repository<Wallet>>"),
    // Database - @todo add database prefix?
    BlockRepository: Symbol.for("Database<BlockRepository>"),
    RoundRepository: Symbol.for("Database<RoundRepository>"),
    TransactionRepository: Symbol.for("Database<TransactionRepository>"),
    // Kernel
    ConfigRepository: Symbol.for("Repository<Config>"),
    ServiceProviderRepository: Symbol.for("Repository<ServiceProvider>"),
    // Blockchain
    StateMachine: Symbol.for("Blockchain<StateMachine>"),
    // State - @todo: better names that won't clash
    BlockState: Symbol.for("State<Block>"),
    StateBlockStore: Symbol.for("State<BlockStore>"),
    StateStore: Symbol.for("State<StateStore>"),
    StateTransactionStore: Symbol.for("State<TransactionStore>"),
    WalletFactory: Symbol.for("State<WalletFactory>"),
    TransactionValidator: Symbol.for("State<TransactionValidator>"),
    TransactionValidatorFactory: Symbol.for("State<TransactionValidatorFactory>"),

    // Derived states
    DposState: Symbol.for("State<DposState>"),
    DposPreviousRoundStateProvider: Symbol("Provider<DposPreviousRoundState>"),

    // P2P - @todo: better names that won't clash
    PeerCommunicator: Symbol.for("Peer<Communicator>"),
    PeerConnector: Symbol.for("Peer<Connector>"),
    PeerNetworkMonitor: Symbol.for("Peer<NetworkMonitor>"),
    PeerProcessor: Symbol.for("Peer<Processor>"),
    PeerStorage: Symbol.for("Peer<Storage>"),
    PeerTransactionBroadcaster: Symbol.for("Peer<TransactionBroadcaster>"),
    // Transaction Pool
    TransactionPoolService: Symbol.for("TransactionPool<Service>"),
    TransactionPoolCleaner: Symbol.for("TransactionPool<Cleaner>"),
    TransactionPoolMemory: Symbol.for("TransactionPool<Memory>"),
    TransactionPoolStorage: Symbol.for("TransactionPool<Storage>"),
    TransactionPoolCollator: Symbol.for("TransactionPool<Collator>"),
    TransactionPoolQuery: Symbol.for("TransactionPool<Query>"),
    TransactionPoolDynamicFeeMatcher: Symbol.for("TransactionPool<DynamicFeeMatcher>"),
    TransactionPoolProcessor: Symbol.for("TransactionPool<Processor>"),
    TransactionPoolProcessorFactory: Symbol.for("TransactionPool<ProcessorFactory>"),
    TransactionPoolSenderState: Symbol.for("TransactionPool<SenderState>"),
    TransactionPoolSenderStateFactory: Symbol.for("TransactionPool<SenderStateFactory>"),
    TransactionPoolExpirationService: Symbol.for("TransactionPool<ExpirationService>"),

    // Transactions - @todo: better names that won't clash
    WalletAttributes: Symbol.for("Wallet<Attributes>"),
    // TransactionHandler
    TransactionHandler: Symbol.for("TransactionHandler"),
    // Registries
    TransactionHandlerRegistry: Symbol.for("Registry<TransactionHandler>"),
    TransactionHandlerProvider: Symbol.for("Provider<TransactionHandler>"),
};
