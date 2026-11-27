import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface LedgerRow {
  date: string;
  journalId: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

@Component({
  standalone: true,
  selector: 'app-ledger-results',
  templateUrl: './ledger-results.component.html'
})
export class LedgerResultsComponent extends ViewBaseComponent implements OnDestroy {
  public accountCode = '';
  public periodLabel = '';
  public rows: LedgerRow[] = [];
  public hasTotals = false;
  public totalDebit = '';
  public totalCredit = '';
  public balance = '';

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

  public override back(): void {
    const event = window.event;
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    super.back();
  }

  private load(): void {
    const query = this.state.context.query || {};
    const rawAccountCode = query['account_code'] === undefined || query['account_code'] === null ? '' : query['account_code'];
    this.accountCode = this.text(this.old('account_code', rawAccountCode));
    const today = this.app.ui.today();
    const fallbackMonth = query['month'] === undefined || query['month'] === '' ? Number(today.slice(5, 7)) : Number(query['month']);
    const fallbackYear = query['year'] === undefined || query['year'] === ''
      ? (this.store.workingYear ? this.store.workingYear() : today.slice(0, 4))
      : query['year'];
    const month = this.text(this.old('month', String(fallbackMonth)));
    const year = this.text(this.old('year', fallbackYear));
    this.periodLabel = this.pad(month) + ' / ' + year;

    let saldo = 0;
    let totalDebe = 0;
    let totalHaber = 0;
    const rows: LedgerRow[] = [];
    const journals = this.state.resource<unknown[]>('journals.ledger', []);
    this.list(journals).forEach((item) => {
      const journal = this.object(item);
      this.list(journal.entries).forEach((value) => {
        const entry = this.object(value);
        if (this.text(entry.account_code) !== this.accountCode) return;
        const debe = Number(entry.debit || 0);
        const haber = Number(entry.credit || 0);
        saldo += debe - haber;
        totalDebe += debe;
        totalHaber += haber;
        rows.push({
          date: this.text(journal.date),
          journalId: this.text(journal.id),
          description: this.text(journal.description || 'Sin glosa'),
          debit: debe > 0 ? this.number(debe) : '-',
          credit: haber > 0 ? this.number(haber) : '-',
          balance: this.number(saldo)
        });
      });
    });

    this.rows = rows;
    this.hasTotals = totalDebe > 0 || totalHaber > 0;
    this.totalDebit = this.number(totalDebe);
    this.totalCredit = this.number(totalHaber);
    this.balance = this.number(saldo);
  }

  private text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private pad(value: unknown): string {
    return this.text(value).padStart(2, '0');
  }

  private list(value: unknown): any[] {
    return Array.isArray(value) ? value : [];
  }

  private object(value: unknown): Record<string, any> {
    return value && typeof value === 'object' ? value as Record<string, any> : {};
  }
}
