import { ChangeDetectorRef, Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppAccountPickerComponent } from '../../shared/ui/app-account-picker.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface JournalRow {
  key: string;
  componentName: string;
  accountCode: string;
  debit: string;
  credit: string;
}

@Component({
  standalone: true,
  selector: 'app-edit-manual-journal',
  templateUrl: './edit-manual-journal.component.html',
  imports: [AppAccountPickerComponent]
})
export class EditManualJournalComponent extends ViewBaseComponent {
  public journalId = '';
  public entryNumber = '';
  public year = '';
  public month = '';
  public date = '';
  public description = '';
  public accounts: Array<Record<string, any>> = [];
  public rows: JournalRow[] = [];
  public sumDebit = '0';
  public sumCredit = '0';
  public balanceDotClass = 'bg-red-500';
  public balanceTextClass = 'text-[11px] font-bold text-red-600 uppercase';
  public balanceText = 'Descuadrado';

  private readonly rememberedValues: Record<string, any> = {};
  private rowCounter = 0;

  constructor(
    app: PlasticinaService,
    state: ViewStateService,
    actions: ActionService,
    private readonly changeDetector: ChangeDetectorRef
  ) {
    super(app, state, actions);
    const remembered = this.app.ui.old();
    this.rememberedValues = this.asRecord(remembered);

    const editor = this.asRecord(this.state.resource<unknown>('editors.journal', {}));
    const journal = this.asRecord(editor['journal']);
    const params = this.state.context.params || {};
    const fallbackId = params['id'] === undefined ? '' : params['id'];
    if (!Object.keys(journal).length && fallbackId && typeof this.store.journal === 'function') {
      const fetched = this.store.journal(fallbackId);
      if (fetched && typeof fetched === 'object') Object.assign(journal, fetched as Record<string, any>);
    }
    this.journalId = this.text(journal['id'] ?? fallbackId);
    this.entryNumber = this.text(journal['entry_number']);
    this.year = this.text(journal['year']);
    this.month = this.text(journal['month'] === undefined || journal['month'] === null || journal['month'] === ''
      ? this.text(journal['date']).slice(5, 7) : journal['month']);
    this.date = String(this.old('date', journal['date']));
    this.description = String(this.old('description', journal['description']));

    this.accounts = this.asAccounts(editor['accounts']);
    if (!this.accounts.length) {
      const owner = this.asRecord(journal['owner']);
      const activeOwner = this.asRecord(typeof this.store.activeOwner === 'function' ? this.store.activeOwner() : null);
      const ownerId = owner['id'] ?? activeOwner['id'];
      this.accounts = this.asAccounts(typeof this.store.accounts === 'function' && ownerId !== undefined
        ? this.store.accounts(ownerId) : []);
    }
    if (!this.accounts.length && typeof this.store.activeOwnerAccounts === 'function') {
      this.accounts = this.asAccounts(this.store.activeOwnerAccounts());
    }

    const oldEntries = this.asRows(this.old('entries', []));
    const entries = this.asRows(journal['entries']);
    this.rows = entries.map((entry, index) => {
      const remembered = oldEntries[index] || entry;
      return this.createRow(remembered.accountCode, remembered.debit, remembered.credit, 'manual');
    });
    this.recalculate();
  }

  public override old(key: string, fallback: any = ''): any {
    const value = this.rememberedValues[key];
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    if (name === 'manualJournal.update') {
      this.rows.forEach((row) => {
        if (String(row.debit).trim() === '') row.debit = '0';
        if (String(row.credit).trim() === '') row.credit = '0';
      });
      this.changeDetector.detectChanges();
    }
    super.submit(name, event);
  }

  public addRow(): void {
    this.rows.push(this.createRow('', '0', '0', 'manual'));
    this.recalculate();
  }

  public removeRow(index: number): void {
    if (this.rows.length > 2) {
      this.rows.splice(index, 1);
      this.recalculate();
      return;
    }
    this.notify('El asiento contable debe tener al menos dos líneas.');
  }

  public onAccountChange(row: JournalRow, value: string | number | null): void {
    row.accountCode = value === null || value === undefined ? '' : String(value);
  }

  public onAmountInput(row: JournalRow, field: 'debit' | 'credit', event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    const numeric = this.amountOf(value);
    if (numeric < 0) {
      value = '0';
      this.notify('No se permiten montos negativos en Debe ni en Haber.');
    }
    if (numeric > 0) {
      const opposite = field === 'debit' ? 'credit' : 'debit';
      if (this.amountOf(row[opposite]) !== 0) {
        row[opposite] = '0';
        this.notify('Cada fila del asiento debe registrar solo Debe o solo Haber.');
      }
    }
    row[field] = value;
    this.recalculate();
  }

  public selectInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (typeof input.select === 'function') input.select();
  }

  public formatTotal(value: number): string {
    return new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  }

  private recalculate(): void {
    const totalDebit = this.rows.reduce((sum, row) => sum + this.amountOf(row.debit), 0);
    const totalCredit = this.rows.reduce((sum, row) => sum + this.amountOf(row.credit), 0);
    this.sumDebit = this.formatTotal(totalDebit);
    this.sumCredit = this.formatTotal(totalCredit);
    const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100) && totalDebit > 0;
    this.balanceDotClass = balanced ? 'bg-green-500' : 'bg-red-500';
    this.balanceTextClass = balanced
      ? 'text-[11px] font-bold text-green-600 uppercase'
      : 'text-[11px] font-bold text-red-600 uppercase';
    this.balanceText = balanced ? 'Cuadrado' : 'Descuadrado';
  }

  private createRow(accountCode: unknown, debit: unknown, credit: unknown, componentName: string): JournalRow {
    const key = 'row_' + this.rowCounter;
    this.rowCounter += 1;
    return {
      key,
      componentName,
      accountCode: this.text(accountCode),
      debit: this.text(debit) || '0',
      credit: this.text(credit) || '0'
    };
  }

  private asRows(value: unknown): Array<{ accountCode: string; debit: string; credit: string; componentName?: string }> {
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
      const row = this.asRecord(item);
      return {
        accountCode: this.text(row['account_code']),
        debit: this.text(row['debit']) || '0',
        credit: this.text(row['credit']) || '0',
        componentName: row['component_name'] === undefined ? undefined : this.text(row['component_name'])
      };
    });
  }

  private asRecord(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
  }

  private asAccounts(value: unknown): Array<Record<string, any>> {
    return Array.isArray(value) ? value as Array<Record<string, any>> : [];
  }

  private amountOf(value: unknown): number {
    const text = value === undefined || value === null ? '' : String(value).trim();
    if (text === '') return 0;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private notify(message: string): void {
    if (typeof this.app.ui.notify === 'function') this.app.ui.notify(message, 'error');
  }
}
