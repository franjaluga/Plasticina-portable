import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-accounting-analytics',
  templateUrl: './accounting-analytics.component.html',
  imports: [AppSelectComponent]
})
export class AccountingAnalyticsComponent extends ViewBaseComponent implements OnDestroy {
  public workingYear = '';
  public startLabel = '';
  public startYear = '';
  public typeVc = 'V';
  public month = '';
  public year = '';
  public readonly typeOptions: SelectOption[] = [
    { value: 'V', label: 'Libro de ventas' },
    { value: 'C', label: 'Libro de compras' }
  ];
  public monthOptions: SelectOption[] = [];

  private readonly subscription = new Subscription();

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    this.subscription.add(this.state.state$.subscribe(() => this.load()));
    this.subscription.add(this.app.refresh$.subscribe(() => this.load()));
    this.load();
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    if (event.defaultPrevented) return;
    const form = event.currentTarget instanceof HTMLFormElement ? event.currentTarget : null;
    const submitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement ? event.submitter : null;
    const message = (submitter && submitter.getAttribute('data-confirm')) || (form && form.getAttribute('data-confirm')) || '';
    if (message && !window.confirm(message)) {
      event.preventDefault();
      return;
    }
    const getRoute = this.app.config.getActions[name] || null;
    if (getRoute) {
      event.preventDefault();
      if (!form) return;
      const values = this.app.readForm(form);
      const rule = this.app.config.reportPeriodRoutes[getRoute];
      if (rule) {
        const status = this.app.reportPeriodStatus(getRoute, values as Record<string, string>);
        if (!status.allowed) {
          this.app.flash('error', this.app.periodHelp(status));
          this.app.refresh$.next();
          return;
        }
      }
      this.app.remember(values);
      this.goTo(name, values);
      return;
    }
    super.submit(name, event);
  }

  private load(): void {
    const query = this.state.context.query || {};
    const today = this.app.ui.today();
    const workingYear = this.store.workingYear ? this.store.workingYear() : today.slice(0, 4);
    this.workingYear = this.text(workingYear);
    const start = this.store.ownerStartPeriod ? this.store.ownerStartPeriod() : null;
    const startYear = start && start.year !== undefined ? start.year : workingYear;
    const startMonth = start && start.month !== undefined ? start.month : 1;
    this.startYear = this.text(startYear);
    this.startLabel = this.pad(startMonth) + '/' + this.text(startYear);

    const typeValue = this.text(this.old('type_vc', query['type_vc'] === 'C' ? 'C' : 'V'));
    this.typeVc = typeValue === 'C' ? 'C' : 'V';
    const fallbackMonth = query['month'] === undefined || query['month'] === ''
      ? Number(today.slice(5, 7))
      : Number(query['month']);
    this.month = this.text(this.old('month', String(fallbackMonth)));
    const fallbackYear = query['year'] === undefined || query['year'] === '' ? workingYear : query['year'];
    this.year = this.text(this.old('year', fallbackYear));

    this.monthOptions = [];
    for (let value = 1; value <= 12; value++) {
      this.monthOptions.push({
        value: String(value),
        label: String(value) + ' - ' + this.capitalize(this.app.ui.monthName(value))
      });
    }
  }

  private capitalize(value: unknown): string {
    const text = this.text(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private pad(value: unknown): string {
    return this.text(value).padStart(2, '0');
  }
}
