import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppAccountPickerComponent } from '../../shared/ui/app-account-picker.component';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface JournalRow {
  key: string;
  accountCode: string;
  debit: string;
  credit: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface TemplateOption {
  key: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-manual-journal-create',
  templateUrl: './manual-journal-create.component.html',
  imports: [AppAccountPickerComponent, AppSelectComponent]
})
export class ManualJournalCreateComponent extends ViewBaseComponent {
  public date = '';
  public month = '';
  public year = '';
  public glosa = '';
  public accounts: Array<Record<string, any>> = [];
  public monthOptions: SelectOption[] = [];
  public templateOptions: TemplateOption[] = [];
  public entryNumberLabel = '';
  public entryNumberHelp = '';
  public hasEntryNumber = false;
  public templatesOpen = false;
  public templatesToggleLabel = '[+] ver asientos prefabricados';
  public templateAmount = '1';
  public rows: JournalRow[] = [];
  public totalDebit = '0';
  public totalCredit = '0';
  public difference = '0';
  public differenceClass = 'text-amber-600';
  public balanceDotClass = 'bg-amber-500';
  public balanceTextClass = 'text-[11px] font-bold uppercase text-amber-600';
  public balanceText = 'Por ingresar';
  public canSave = false;

  @ViewChild('templateAmountInput') private templateAmountInput?: ElementRef<HTMLInputElement>;

  private readonly rememberedValues: Record<string, any> = {};
  private templates: Record<string, any> = {};
  private ownerId: number | string = '';
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

    const editor = this.asRecord(this.state.resource<unknown>('editors.manualJournal', {}));
    const owner = this.asRecord(editor['owner']);
    const storeOwner = this.asRecord(this.store.activeOwner ? this.store.activeOwner() : null);
    const activeOwner = Object.keys(owner).length ? owner : storeOwner;
    this.ownerId = activeOwner['id'] === undefined || activeOwner['id'] === null ? '' : activeOwner['id'];

    const workingYear = Number(editor['workingYear'] ?? (this.store.workingYear ? this.store.workingYear() : new Date().getFullYear()));
    this.accounts = this.asAccounts(editor['accounts']);
    if (!this.accounts.length) {
      this.accounts = this.asAccounts(this.store.activeOwnerAccounts ? this.store.activeOwnerAccounts() : []);
    }
    this.templates = this.asRecord(editor['templates']);

    const query = this.state.context.query || {};
    const today = this.app.ui.today();
    this.date = String(this.old('date', query['date'] === undefined ? today : query['date']));
    const defaultMonth = query['month'] === undefined || query['month'] === ''
      ? Number(today.slice(5, 7)) : Number(query['month']);
    this.month = String(this.old('month', String(defaultMonth)));
    this.year = String(this.old('year', query['year'] === undefined || query['year'] === '' ? String(workingYear) : query['year']));
    this.glosa = String(this.old('glosa', ''));

    const proposedYear = Number(this.year);
    const proposedEntry = editor['entryNumber'] === undefined || editor['entryNumber'] === null
      ? (this.ownerId && Number.isInteger(proposedYear) && typeof this.store.nextEntryNumber === 'function'
        ? this.store.nextEntryNumber(this.ownerId, proposedYear) : 0)
      : Number(editor['entryNumber']);
    const proposedEntryNumber = Number.isFinite(proposedEntry) ? proposedEntry : 0;
    const lastEntryNumber = proposedEntryNumber > 0 ? proposedEntryNumber - 1 : 0;
    this.hasEntryNumber = proposedEntryNumber > 0;
    this.entryNumberLabel = this.hasEntryNumber ? this.text(proposedEntryNumber) : '—';
    this.entryNumberHelp = proposedEntryNumber > 0
      ? (lastEntryNumber > 0 ? 'Último asiento N° ' + lastEntryNumber + ' · ' : 'Sin asientos registrados · ') +
        'Próximo N° ' + proposedEntryNumber + '\n' +
        'El número definitivo se asigna al guardar; si otro asiento se registra primero, se recalculará automáticamente.'
      : 'Seleccione una empresa activa para ver el número propuesto.';

    for (let value = 1; value <= 12; value++) {
      this.monthOptions.push({ value: String(value), label: String(value) });
    }
    this.templateOptions = Object.keys(this.templates).map((key) => {
      const template = this.asRecord(this.templates[key]);
      const label = String(template['name'] ?? template['title'] ?? this.capitalize(key.replace(/_/g, ' ')));
      return { key, label };
    });

    const oldEntries = this.asRows(this.old('entries', []));
    this.rows = oldEntries.length
      ? oldEntries.map((entry) => this.createRow(entry.accountCode, entry.debit, entry.credit))
      : [this.createRow('', '0', '0'), this.createRow('', '0', '0')];
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
    if (name === 'manualJournal.store') {
      this.rows.forEach((row) => {
        if (String(row.debit).trim() === '') row.debit = '0';
        if (String(row.credit).trim() === '') row.credit = '0';
      });
      this.rows = this.rows.filter((row) =>
        row.accountCode.trim() !== '' || this.amountOf(row.debit) !== 0 || this.amountOf(row.credit) !== 0);
      this.changeDetector.detectChanges();
      const hasAmount = this.rows.some((row) =>
        Math.round(this.amountOf(row.debit)) !== 0 || Math.round(this.amountOf(row.credit)) !== 0);
      if (!hasAmount) {
        event.preventDefault();
        this.notify('El asiento está por ingresar; ingrese montos antes de guardar.');
        return;
      }
      if (this.rows.length < 2) {
        event.preventDefault();
        this.notify('El asiento debe tener al menos dos líneas.');
        return;
      }
      if (this.rows.some((row) => !row.accountCode.trim())) {
        event.preventDefault();
        this.notify('Cada línea con monto debe tener una cuenta contable.');
        return;
      }
      this.recalculate();
    }
    super.submit(name, event);
  }

  public onTemplateAmount(event: Event): void {
    this.templateAmount = (event.target as HTMLInputElement).value;
  }

  public toggleTemplates(): void {
    this.templatesOpen = !this.templatesOpen;
    this.templatesToggleLabel = this.templatesOpen
      ? '[−] ocultar asientos prefabricados'
      : '[+] ver asientos prefabricados';
    if (this.templatesOpen) {
      setTimeout(() => this.templateAmountInput?.nativeElement.focus());
    }
  }

  public loadTemplate(key: string): void {
    const template = this.templates[key];
    if (!template) return;
    const record = this.asRecord(template);
    const amount = Number(String(this.templateAmount).trim());
    if (!Number.isInteger(amount) || amount <= 0) {
      this.notify('Por favor, ingrese un monto entero mayor a 0.');
      return;
    }
    this.glosa = String(record['glosa'] ?? '');
    this.rows = [];
    this.rowCounter = 0;
    const source = typeof this.store.journalTemplateEntries === 'function'
      ? this.store.journalTemplateEntries(key, amount) : [];
    const entries = this.asRows(source);
    if (entries.length) {
      entries.forEach((entry) => this.rows.push(this.createRow(entry.accountCode, entry.debit, entry.credit)));
    } else {
      this.rows.push(this.createRow('', '0', '0'), this.createRow('', '0', '0'));
    }
    this.recalculate();
  }

  public addRow(): void {
    this.rows.push(this.createRow('', '0', '0'));
    this.recalculate();
  }

  public insertRow(index: number): void {
    this.rows.splice(index + 1, 0, this.createRow('', '0', '0'));
    this.recalculate();
  }

  public removeRow(index: number): void {
    if (this.rows.length > 2) {
      this.rows.splice(index, 1);
      this.recalculate();
      return;
    }
    this.notify('El asiento debe tener al menos dos líneas.');
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

  public onAmountBlur(row: JournalRow, field: 'debit' | 'credit', event: Event): void {
    const input = event.target as HTMLInputElement;
    if (String(input.value).trim() === '') row[field] = '0';
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
    const rawDebit = this.rows.reduce((sum, row) => sum + this.amountOf(row.debit), 0);
    const rawCredit = this.rows.reduce((sum, row) => sum + this.amountOf(row.credit), 0);
    const roundedDebit = Math.round(rawDebit);
    const roundedCredit = Math.round(rawCredit);
    const difference = roundedDebit - roundedCredit;
    const empty = roundedDebit === 0 && roundedCredit === 0;
    const balanced = !empty && difference === 0;
    const tone = empty ? 'amber' : balanced ? 'green' : 'red';
    const colorClass = tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-green-600' : 'text-red-600';
    this.totalDebit = this.formatTotal(rawDebit);
    this.totalCredit = this.formatTotal(rawCredit);
    this.difference = this.formatTotal(difference);
    this.differenceClass = colorClass;
    this.balanceDotClass = tone === 'amber' ? 'bg-amber-500' : tone === 'green' ? 'bg-green-500' : 'bg-red-500';
    this.balanceTextClass = 'text-[11px] font-bold uppercase ' + colorClass;
    this.balanceText = empty ? 'Por ingresar' : balanced ? 'Cuadrado' : 'Descuadrado';
    this.canSave = balanced;
  }

  private createRow(accountCode: unknown, debit: unknown, credit: unknown): JournalRow {
    const key = 'row_' + this.rowCounter;
    this.rowCounter += 1;
    return {
      key,
      accountCode: this.text(accountCode),
      debit: this.text(debit) || '0',
      credit: this.text(credit) || '0'
    };
  }

  private asRows(value: unknown): Array<{ accountCode: string; debit: string; credit: string }> {
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
      const row = this.asRecord(item);
      return {
        accountCode: this.text(row['account_code']),
        debit: this.text(row['debit']) || '0',
        credit: this.text(row['credit']) || '0'
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

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private notify(message: string): void {
    if (typeof this.app.ui.notify === 'function') this.app.ui.notify(message, 'error');
  }
}
