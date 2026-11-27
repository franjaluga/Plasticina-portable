import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppAccountPickerComponent } from '../../shared/ui/app-account-picker.component';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-ledger-context',
  templateUrl: './ledger-context.component.html',
  imports: [AppSelectComponent, AppAccountPickerComponent]
})
export class LedgerContextComponent extends ViewBaseComponent implements OnDestroy {
  public accounts: Array<Record<string, any>> = [];
  public ownerId: number | string = '';
  public accountCode = '';
  public month = '';
  public year = '';
  public monthOptions: SelectOption[] = [];
  public startLabel = '';
  public startYear = 2000;

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

  public onAccountChange(value: string): void {
    this.accountCode = value;
  }

  public onMonthChange(value: string | number | null): void {
    this.month = value === null || value === undefined ? '' : String(value);
  }

  public onYearChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input) this.year = input.value;
  }

  private load(): void {
    const query = this.ctx.query || {};
    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    this.ownerId = owner ? owner.id : '';
    this.accounts = this.state.resource<Array<Record<string, any>>>('catalogs.accounts', this.fallbackAccounts(owner)) || [];

    const start = this.store.ownerStartPeriod ? this.store.ownerStartPeriod() : null;
    const startMonth = start && Number.isFinite(Number(start.month)) ? Number(start.month) : new Date().getMonth() + 1;
    this.startYear = start && Number.isFinite(Number(start.year)) ? Number(start.year) : new Date().getFullYear();
    this.startLabel = this.pad(startMonth) + '/' + this.startYear;

    const today = this.app.ui.today();
    const month = query['month'] === undefined || query['month'] === ''
      ? Number(today.slice(5, 7))
      : Number(query['month']);
    const year = query['year'] === undefined || query['year'] === ''
      ? Number(this.store.workingYear ? this.store.workingYear() : today.slice(0, 4))
      : query['year'];

    this.accountCode = String(this.old('account_code', query['account_code'] === undefined ? '' : query['account_code']));
    this.month = String(this.old('month', String(month)));
    this.year = String(this.old('year', String(year)));
    this.monthOptions = [];
    for (let value = 1; value <= 12; value++) {
      this.monthOptions.push({ value: String(value), label: String(value) });
    }
  }

  private fallbackAccounts(owner: Record<string, any> | null): Array<Record<string, any>> {
    const source = owner && this.store.accounts
      ? this.store.accounts(owner.id)
      : (this.store.activeOwnerAccounts ? this.store.activeOwnerAccounts() : []);
    return Array.isArray(source) ? source : [];
  }

  private pad(value: unknown): string {
    return String(value).padStart(2, '0');
  }
}
