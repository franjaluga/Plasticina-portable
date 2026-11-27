import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, defer, from, shareReplay } from 'rxjs';
import { FormService } from './form.service';
import { VIEW_RESOURCES } from './view-resources';

export interface ViewContext {
  ownerId: number | string | null;
  workingYear: number;
  year: number;
  month: number;
  params: Record<string, string>;
  query: Record<string, string>;
  include: string[];
}

export interface PeriodStatus {
  allowed: boolean;
  reason?: string;
  startMonth?: number | string;
  startYear?: number | string;
  year?: number | string;
  month?: number | string;
}

@Injectable({ providedIn: 'root' })
export class PlasticinaService {
  readonly refresh$ = new Subject<void>();
  readonly externalChange$ = new Subject<unknown>();

  private watching = false;
  private initialized = false;

  readonly ready$: Observable<void> = defer(() => from(this.database().ready)).pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  );

  constructor(
    private readonly zone: NgZone,
    private readonly forms: FormService
  ) {}

  get config(): PlasticinaAppNamespace['config'] {
    return this.namespace().app.config;
  }

  get store(): Record<string, any> {
    return window.Store;
  }

  get data(): PlasticinaDataApi {
    return window.Data;
  }

  get ui(): Window['UI'] {
    return window.UI;
  }

  private namespace(): PlasticinaNamespace {
    if (!window.Plasticina || !window.Plasticina.db) {
      throw new Error('El núcleo SQLite de Plasticina no está disponible en este documento.');
    }
    return window.Plasticina;
  }

  private database(): PlasticinaDb {
    return this.namespace().db;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.database().ready;
    await this.store.load();
    window.App = {
      render: () => this.zone.run(() => this.refresh$.next()),
      navigate: (path: string) => this.navigate(path)
    };
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }
    this.watchExternalChanges();
    this.initialized = true;
  }

  private watchExternalChanges(): void {
    if (this.watching || !this.database().onExternalChange) return;
    this.watching = true;
    this.database().onExternalChange((change) => {
      this.zone.run(() => {
        Promise.resolve(this.database().ensureFresh())
          .then(() => {
            this.store.refresh();
            this.data.invalidate();
            this.externalChange$.next(change);
            this.refresh$.next();
          })
          .catch((error: unknown) => this.flash('error', this.message(error)));
      });
    });
  }

  applyBodyClass(view: string): void {
    document.body.className = this.config.bodyClasses[view] || this.config.bodyClasses.welcome || '';
  }

  context(params: Record<string, string>, query: Record<string, string>): ViewContext {
    const loaded = Boolean(this.store.state);
    const owner = loaded && this.store.activeOwner ? this.store.activeOwner() : null;
    const workingYear = loaded ? Number(this.store.workingYear()) : new Date().getFullYear();
    const today = this.ui && typeof this.ui.today === 'function'
      ? this.ui.today()
      : new Date().toISOString().slice(0, 10);
    return {
      ownerId: owner ? owner.id : null,
      workingYear,
      year: query.year === undefined || query.year === '' ? workingYear : Number(query.year),
      month: query.month === undefined || query.month === '' ? Number(today.slice(5, 7)) : Number(query.month),
      params,
      query,
      include: []
    };
  }

  resourcesFor(view: string): string[] {
    return (VIEW_RESOURCES[view] || []).slice();
  }

  async resolve(resources: string[], context: ViewContext): Promise<Record<string, any>> {
    if (!resources.length) return {};
    return this.data.resolveMany(resources, context) as Promise<Record<string, any>>;
  }

  flash(type: string, message: string): void {
    this.ui.flash(type, message);
  }

  remember(values: unknown): void {
    this.ui.remember(values);
  }

  readForm(form: HTMLFormElement): Record<string, any> {
    return this.forms.readForm(form);
  }

  route(name: string, parameters?: unknown): string {
    return this.ui.route(name, parameters);
  }

  navigate(path: string): void {
    const target = path.charAt(0) === '#' ? path : '#' + path;
    if (window.location.hash === target) {
      this.refresh$.next();
      return;
    }
    window.location.hash = target;
  }

  reportPeriodStatus(path: string, query: Record<string, string>): PeriodStatus {
    const rule = this.config.reportPeriodRoutes[path];
    if (!rule) return { allowed: true };
    const period = this.reportPeriodValues(rule.kind, query);
    return this.store.reportPeriodStatus(period.year, period.month) as PeriodStatus;
  }

  reportPeriodContext(path: string): string | null {
    const rule = this.config.reportPeriodRoutes[path];
    return rule ? rule.context : null;
  }

  periodHelp(status: PeriodStatus): string {
    if (status.reason === 'before-start') {
      return 'La fecha no puede ser anterior a ' + this.pad(status.startMonth) + '/' + status.startYear +
        ', mes/año de inicio de actividades de esta empresa.';
    }
    if (status.reason === 'invalid') {
      return 'Selecciona un mes y año válidos.';
    }
    return '';
  }

  balancePeriodHelp(status: PeriodStatus): string {
    if (status.reason === 'no-data') {
      return 'No hay contabilidad disponible para este negocio. No es posible generar el balance.';
    }
    const help = this.periodHelp(status);
    return help ? help + ' No es posible generar el balance.' : '';
  }

  message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private reportPeriodValues(kind: string, values: Record<string, string>): { year: number | string; month: number | string } {
    const source = values || {};
    const today = this.ui.today();
    if (kind === 'month-year') {
      return {
        year: source.year === undefined || source.year === '' ? this.store.workingYear() : source.year,
        month: source.month === undefined || source.month === '' ? today.slice(5, 7) : source.month
      };
    }
    if (kind === 'date-from' || kind === 'date-from-or-year') {
      const match = /^(\d{4})-(\d{1,2})/.exec(String(source.date_from || ''));
      if (match) return { year: match[1], month: match[2] };
      if (kind === 'date-from-or-year') {
        return { year: source.year === undefined || source.year === '' ? this.store.workingYear() : source.year, month: 12 };
      }
      return { year: today.slice(0, 4), month: today.slice(5, 7) };
    }
    return { year: source.year === undefined || source.year === '' ? this.store.workingYear() : source.year, month: 12 };
  }

  private pad(value: unknown): string {
    return String(value === undefined || value === null ? '' : value).padStart(2, '0');
  }
}
