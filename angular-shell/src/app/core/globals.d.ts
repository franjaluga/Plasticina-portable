interface PlasticinaDb {
  ready: Promise<void>;
  isReady(): boolean;
  version(): number;
  revision(): number;
  all(sql: string, params?: unknown[]): Record<string, unknown>[];
  get(sql: string, params?: unknown[]): Record<string, unknown> | null;
  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number };
  transaction<T>(work: () => T): Promise<T> | T;
  ensureFresh(): Promise<void>;
  flush(): Promise<unknown>;
  onExternalChange(listener: (change: unknown) => void): () => void;
}

interface PlasticinaDataApi {
  resolve(name: string, context?: unknown): Promise<unknown> | unknown;
  resolveMany(names: string[], context?: unknown): Promise<Record<string, unknown>>;
  invalidate(): void;
}

interface PlasticinaViewApi {
  (context?: unknown): string;
  resources?: string[];
}

interface PlasticinaViewHelpers {
  bindDropdowns(container?: ParentNode | null): unknown[];
  bindAccountSearchFormsIn(container?: ParentNode | null, resolver?: unknown, options?: unknown): unknown[];
  reportPeriodHelp(status: { reason?: string }): { text: string };
  balancePeriodHelp(status: { reason?: string }): { text: string };
}

interface PlasticinaActionsHelpers {
  readForm(form: HTMLFormElement): Record<string, unknown>;
}

interface PlasticinaAppNamespace {
  config: {
    routes: { path: string; view: string }[];
    bodyClasses: Record<string, string>;
    getActions: Record<string, string>;
    reportPeriodRoutes: Record<string, { kind: string; context: string }>;
  };
  viewData?: { resourcesFor(view: string): string[]; loading(view: string): string };
  exportSystemJournalsCsv?(query: Record<string, string>): void;
  exportTaxBalanceCsv?(query: Record<string, string>): void;
}

interface PlasticinaNamespace {
  db: PlasticinaDb;
  ui?: Record<string, unknown>;
  store?: { internals?: unknown };
  views?: { helpers?: PlasticinaViewHelpers };
  actions?: { helpers?: PlasticinaActionsHelpers };
  app: PlasticinaAppNamespace;
}

interface PlasticinaSqliteBridge {
  read(): Promise<{ bytes: Uint8Array | null; revision: number }>;
  write(bytes: Uint8Array, writerId: string): Promise<{ revision: number }>;
  acquireLock(): Promise<number>;
  releaseLock(token: number): Promise<void>;
  onChanged(handler: (payload: unknown) => void): () => void;
}

interface Window {
  Plasticina: PlasticinaNamespace;
  Store: Record<string, any>;
  Data: PlasticinaDataApi;
  UI: {
    h(value: unknown): string;
    json(value: unknown): string;
    number(value: unknown, decimals?: number): string;
    money(value: unknown): string;
    today(): string;
    monthName(month: unknown): string;
    route(name: string, parameters?: unknown): string;
    parseHash(hash: string): { path: string; query: Record<string, string> };
    flash(type: string, message: string): void;
    takeFlash(): string;
    remember(values: unknown): void;
    old(key?: string, fallback?: unknown): unknown;
    notify?(message: string, type?: string): void;
  };
  Views?: Record<string, PlasticinaViewApi>;
  Actions?: Record<string, (source?: unknown) => unknown>;
  App?: { render(): void; navigate(path: string): void };
  plasticinaSqlite?: PlasticinaSqliteBridge;
  __PLASTICINA_SQLITE_BYTES__?: Uint8Array | number[] | null;
}
