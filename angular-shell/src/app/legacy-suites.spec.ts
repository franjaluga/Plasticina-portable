interface LegacyTestResult {
  name: string;
  ok: boolean;
  error?: string;
}

interface LegacyTestApi {
  run(): Promise<LegacyTestResult[]>;
  test(name: string, callback: () => unknown | Promise<unknown>): void;
}

describe('suites contables ejecutadas desde Angular', () => {
  let results: LegacyTestResult[] = [];

  beforeAll(async () => {
    const host = window as unknown as {
      __PLASTICINA_LOAD_LEGACY__?: () => Promise<void>;
      PlasticinaTest?: LegacyTestApi;
    };
    if (!host.__PLASTICINA_LOAD_LEGACY__) {
      throw new Error('El cargador de suites legacy no está disponible.');
    }
    await host.__PLASTICINA_LOAD_LEGACY__();
    await window.Plasticina.db.ready;
    await window.Store.load();
    results = await (host.PlasticinaTest as LegacyTestApi).run();
  }, 180000);

  it('ejecuta todas las comprobaciones migradas', () => {
    expect(results.length).toBeGreaterThan(0);
    const failures = results.filter((result) => !result.ok);
    const detail = failures.map((result) => result.name + ': ' + result.error).join('\n');
    expect(detail).toBe('');
  });
});
