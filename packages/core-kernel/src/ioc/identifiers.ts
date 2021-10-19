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
    ProcessActionsManager: Symbol.for("Manager<ProcessAction>"),
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
    StandardCriteriaService: Symbol.for("Service<StandardCriteriaService>"),
    PaginationService: Symbol.for("Service<PaginationService>"),
    TriggerService: Symbol.for("Service<Actions>"),
    ProcessActionsService: Symbol.for("Service<ProcessActions>"),
    ValidationService: Symbol.for("Service<Validation>"),
    BlockHistoryService: Symbol.for("Service<BlockHistory>"),
    TransactionHistoryService: Symbol.for("Service<TransactionHistory>"),

    // Factories
    CacheFactory: Symbol.for("Factory<Cache>"),
    PeerFactory: Symbol.for("Factory<Peer>"),
    PipelineFactory: Symbol.for("Factory<Pipeline>"),
    QueueFactory: Symbol.for("Factory<Queue>"),

    // Database
    DatabaseLogger: Symbol.for("Database<Logger>"),
    DatabaseConnection: Symbol.for("Database<Connection>"),
    DatabaseRoundRepository: Symbol.for("Database<RoundRepository>"),
    DatabaseBlockRepository: Symbol.for("Database<BlockRepository>"),
    DatabaseBlockFilter: Symbol.for("Database<BlockFilter>"),
    DatabaseTransactionRepository: Symbol.for("Database<TransactionRepository>"),
    DatabaseTransactionFilter: Symbol.for("Database<TransactionFilter>"),
    DatabaseModelConverter: Symbol.for("Database<ModelConverter>"),
    DatabaseInteraction: Symbol.for("Database<DatabaseInteraction>"),
    DatabaseWalletsTableService: Symbol.for("Database<WalletsTableService>"),

    // Kernel
    ConfigRepository: Symbol.for("Repository<Config>"),
    ServiceProviderRepository: Symbol.for("Repository<ServiceProvider>"),
    // Blockchain
    StateMachine: Symbol.for("Blockchain<StateMachine>"),
    BlockProcessor: Symbol.for("Block<Processor>"),
    // State - @todo: better names that won't clash
    BlockState: Symbol.for("State<Block>"),
    RoundState: Symbol.for("State<Round>"),
    StateBlockStore: Symbol.for("State<BlockStore>"),
    StateStore: Symbol.for("State<StateStore>"),
    StateBuilder: Symbol.for("State<StateBuilder>"),
    StateTransactionStore: Symbol.for("State<TransactionStore>"),
    StateWalletSyncService: Symbol.for("State<WalletSyncService>"),
    WalletFactory: Symbol.for("State<WalletFactory>"),
    WalletRepository: Symbol.for("Repository<Wallet>"),
    WalletRepositoryIndexerIndex: Symbol.for("IndexerIndex<Repository<Wallet>>"),
    TransactionValidator: Symbol.for("State<TransactionValidator>"),
    TransactionValidatorFactory: Symbol.for("State<TransactionValidatorFactory>"),
    DatabaseInterceptor: Symbol.for("State<DatabaseInterceptor>"),

    // Derived states
    DposState: Symbol.for("State<DposState>"),
    DposPreviousRoundStateProvider: Symbol("Provider<DposPreviousRoundState>"),

    // P2P - @todo: better names that won't clash
    PeerCommunicator: Symbol.for("Peer<Communicator>"),
    PeerConnector: Symbol.for("Peer<Connector>"),
    PeerChunkCache: Symbol.for("Peer<ChunkCache>"),
    PeerNetworkMonitor: Symbol.for("Peer<NetworkMonitor>"),
    PeerProcessor: Symbol.for("Peer<Processor>"),
    PeerRepository: Symbol.for("Peer<Repository>"),
    PeerTransactionBroadcaster: Symbol.for("Peer<TransactionBroadcaster>"),
    PeerEventListener: Symbol.for("Peer<EventListener>"),
    P2PServer: Symbol.for("Server<P2P>"),

    // Transaction Pool
    TransactionPoolService: Symbol.for("TransactionPool<Service>"),
    TransactionPoolCleaner: Symbol.for("TransactionPool<Cleaner>"),
    TransactionPoolMempool: Symbol.for("TransactionPool<Mempool>"),
    TransactionPoolStorage: Symbol.for("TransactionPool<Storage>"),
    TransactionPoolCollator: Symbol.for("TransactionPool<Collator>"),
    TransactionPoolQuery: Symbol.for("TransactionPool<Query>"),
    TransactionPoolDynamicFeeMatcher: Symbol.for("TransactionPool<DynamicFeeMatcher>"),
    TransactionPoolProcessorExtension: Symbol.for("TransactionPool<ProcessorExtension>"),
    TransactionPoolProcessor: Symbol.for("TransactionPool<Processor>"),
    TransactionPoolProcessorFactory: Symbol.for("TransactionPool<ProcessorFactory>"),
    TransactionPoolSenderMempool: Symbol.for("TransactionPool<SenderMempool>"),
    TransactionPoolSenderMempoolFactory: Symbol.for("TransactionPool<SenderMempoolFactory>"),
    TransactionPoolSenderState: Symbol.for("TransactionPool<SenderState>"),
    TransactionPoolExpirationService: Symbol.for("TransactionPool<ExpirationService>"),
    TransactionPoolWorkerPool: Symbol.for("TransactionPool<WorkerPool>"),
    TransactionPoolWorker: Symbol.for("TransactionPool<Worker>"),
    TransactionPoolWorkerFactory: Symbol.for("TransactionPool<WorkerFactory>"),
    TransactionPoolWorkerIpcSubprocessFactory: Symbol.for("TransactionPool<WorkerIpcSubprocessFactory>"),

    // Transactions - @todo: better names that won't clash
    WalletAttributes: Symbol.for("Wallet<Attributes>"),
    // TransactionHandler
    TransactionHandler: Symbol.for("TransactionHandler"),
    TransactionHandlerConstructors: Symbol.for("TransactionHandlerConstructors"),
    // Registries
    TransactionHandlerRegistry: Symbol.for("Registry<TransactionHandler>"),
    TransactionHandlerProvider: Symbol.for("Provider<TransactionHandler>"),

    // Watcher
    WatcherEventListener: Symbol.for("Watcher<EventListener>"),
    WatcherDatabaseService: Symbol.for("Watcher<DatabaseService>"),
};
