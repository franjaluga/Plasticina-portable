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

interface BalanceStatus {
  allowed: boolean;
  reason?: string;
  year?: number | string;
  month?: number | string;
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const VALID_HELP_CLASS = 'text-[11px] text-slate-400 mt-2';
const ERROR_HELP_CLASS = 'text-[11px] text-rose-600 mt-2';

@Component({
  standalone: true,
  selector: 'app-balance-context',
  templateUrl: './balance-context.component.html',
  imports: [AppSelectComponent]
})
export class BalanceContextComponent extends ViewBaseComponent implements OnDestroy {
  public month = '';
  public year = '';
  public monthOptions: SelectOption[] = [];
  public periodHelpText = '';
  public periodHelpClass = VALID_HELP_CLASS;
  public periodValid = false;

  private readonly reportPath = '/vc-documents/balance-tributario';
  private readonly subscription = new Subscription();

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    this.subscription.add(this.state.state$.subscribe(() => this.load()));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public onMonthChange(value: string | number | null): void {
    this.month = this.pad(value === null || value === undefined ? '' : value);
    this.refreshPeriod();
  }

  public onYearChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input) this.year = input.value;
    this.refreshPeriod();
  }

  private load(): void {
    const query = this.ctx.query || {};
    const today = this.app.ui.today();
    const rawMonth = Number(query['month']);
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth
      : Number(today.slice(5, 7));
    const rawYear = Number(query['year']);
    const workingYear = Number(this.store.workingYear ? this.store.workingYear() : today.slice(0, 4));
    const year = Number.isInteger(rawYear) && rawYear >= 2000 ? rawYear : workingYear;

    this.month = this.pad(String(this.old('month', this.pad(month))));
    this.year = String(this.old('year', String(year)));
    this.monthOptions = MONTH_NAMES.map((name, index) => {
      const value = this.pad(index + 1);
      return { value, label: value + ' - ' + name };
    });
    this.refreshPeriod();
  }

  private refreshPeriod(): void {
    const status = this.app.reportPeriodStatus(this.reportPath, { month: this.month, year: this.year }) as BalanceStatus;
    const help = this.app.periodHelp(status);

    if (status.allowed && this.hasNoAccountingData()) {
      this.periodValid = false;
      this.periodHelpText = 'No hay contabilidad disponible para este negocio. No es posible generar el balance.';
      this.periodHelpClass = ERROR_HELP_CLASS;
      return;
    }

    if (!status.allowed) {
      this.periodValid = false;
      const base = help || 'Selecciona un mes y año válidos.';
      this.periodHelpText = base + ' No es posible generar el balance.';
      this.periodHelpClass = ERROR_HELP_CLASS;
      return;
    }

    const year = Number(status.year === undefined ? this.year : status.year);
    const month = Number(status.month === undefined ? this.month : status.month);
    const lastDay = new Date(year, month, 0).getDate();
    this.periodValid = true;
    this.periodHelpText = 'Se procesa desde 01/01/' + year + ' hasta el ' + this.pad(lastDay) + '/' + this.pad(month) + '/' + year + '.';
    this.periodHelpClass = VALID_HELP_CLASS;
  }

  private hasNoAccountingData(): boolean {
    if (typeof this.store.balancePeriodStatus !== 'function') return false;
    const status = this.store.balancePeriodStatus(this.year, this.month) as { reason?: string } | null;
    return !!status && status.reason === 'no-data';
  }

  private pad(value: unknown): string {
    return String(value).padStart(2, '0');
  }
}
