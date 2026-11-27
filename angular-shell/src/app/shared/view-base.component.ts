import { ActionService } from '../core/action.service';
import { PlasticinaService, ViewContext } from '../core/plasticina.service';
import { ViewStateService } from '../core/view-state.service';

export abstract class ViewBaseComponent {
  protected readonly app: PlasticinaService;
  protected readonly state: ViewStateService;
  protected readonly actions: ActionService;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    this.app = app;
    this.state = state;
    this.actions = actions;
  }

  protected get ctx(): ViewContext {
    return this.state.context;
  }

  protected get data(): Record<string, any> {
    return this.state.data;
  }

  protected resource<T>(name: string, fallback: T): T {
    return this.state.resource(name, fallback);
  }

  protected get store(): Record<string, any> {
    return this.app.store;
  }

  protected route(name: string, parameters?: unknown): string {
    return this.app.route(name, parameters);
  }

  protected go(nameOrPath: string, parameters?: unknown): void {
    this.app.navigate(parameters ? this.app.route(nameOrPath, parameters) : this.app.route(nameOrPath));
  }

  protected goTo(nameOrPath: string, parameters?: unknown): void {
    this.go(nameOrPath, parameters);
  }

  protected back(): void {
    window.history.back();
  }

  protected h(value: unknown): string {
    return this.app.ui.h(value);
  }

  protected money(value: unknown): string {
    return this.app.ui.money(value);
  }

  protected number(value: unknown): string {
    return this.app.ui.number(value);
  }

  protected formatDate(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  protected old(key: string, fallback: any = ''): any {
    return this.app.ui.old(key, fallback);
  }

  protected flash(type: string, message: string): void {
    this.app.flash(type, message);
  }

  protected submit(name: string, event: Event): void {
    if (event.defaultPrevented) return;
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || form.dataset.submitting === '1') return;
    const submitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement ? event.submitter : null;
    const message = (submitter && submitter.getAttribute('data-confirm')) || form.getAttribute('data-confirm');
    if (message && !window.confirm(message)) return;
    form.dataset.submitting = '1';
    Promise.resolve(this.actions.execute(name, form)).finally(() => {
      form.dataset.submitting = '';
    });
  }

  protected linkAction(name: string, event: Event): void {
    event.preventDefault();
    const element = event.currentTarget;
    if (!(element instanceof HTMLElement) || element.getAttribute('data-executing') === '1') return;
    const message = element.getAttribute('data-confirm');
    if (message && !window.confirm(message)) return;
    element.setAttribute('data-executing', '1');
    Promise.resolve(this.actions.execute(name, element)).finally(() => {
      element.setAttribute('data-executing', '');
    });
  }

  protected message(error: unknown): string {
    return this.app.message(error);
  }
}
