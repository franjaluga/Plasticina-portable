import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface PreviewRow {
  line: number;
  cells: Record<string, string>;
  derived: Record<string, string>;
}

interface RowIssue {
  row: number;
  line: number;
  cells: Record<string, string[]>;
  messages: string[];
  count: number;
}

interface ValidationResult {
  ok: boolean;
  errorCount: number;
  validRows: number;
  totalRows: number;
  rowIssues: RowIssue[];
  periodErrors: string[];
}

interface DerivedField {
  key: string;
  label: string;
}

const REQUIRED = ['Tipo Doc', 'RUT Proveedor', 'Razon Social', 'Folio', 'Fecha Docto', 'Monto Total'];
const DERIVED: DerivedField[] = [{ key: 'document_type_name', label: 'Nombre documento' }];

@Component({
  selector: 'app-import-purchases-preview',
  standalone: true,
  templateUrl: './import-purchases-preview.component.html'
})
export class IngressImportPurchasesPreviewComponent extends ViewBaseComponent {
  public hasPreview = false;
  public headers: string[] = [];
  public rows: PreviewRow[] = [];
  public readonly derivedFields = DERIVED;
  public month: string | number;
  public year: string | number;
  public fileName = 'documentos.csv';
  public periodLabel = '';
  public backHref = '';
  public validation: ValidationResult = this.emptyValidation();
  public status = '';
  public validRows = 0;
  public invalidRows = 0;
  public totalAmount = '0';
  public vatAmount = '0';
  public processLabel = 'Procesar 0 documentos';
  public canProcess = false;

  @ViewChild('sheetBody') private sheetBody?: ElementRef<HTMLTableSectionElement>;

  private readonly formatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const query = this.state.context.query || {};
    const remembered = this.old();
    const fromState = this.state.data['ingress.preview'];
    const stored = fromState && typeof fromState === 'object' ? fromState as Record<string, unknown> : {};
    const source = Object.assign({}, stored, remembered && typeof remembered === 'object' ? remembered : {});
    const month = source['month_register'] === undefined || source['month_register'] === ''
      ? (query['month_register'] === undefined || query['month_register'] === '' ? new Date().getMonth() + 1 : query['month_register'])
      : source['month_register'];
    const year = source['year_register'] === undefined || source['year_register'] === ''
      ? (query['year_register'] === undefined || query['year_register'] === '' ? this.store.workingYear() : query['year_register'])
      : source['year_register'];
    const headers = Array.isArray(source['headers']) ? this.normalizeHeaders(source['headers']) : [];
    const rows = Array.isArray(source['rows']) ? this.normalizeRows(source['rows']) : [];

    this.month = month as string | number;
    this.year = year as string | number;
    this.fileName = String(source['fileName'] || query['file_name'] || 'documentos.csv');
    this.periodLabel = String(this.month).padStart(2, '0') + '/' + String(this.year);
    this.backHref = this.route('ingress.import.purchases', {
      month_register: this.month,
      year_register: this.year,
      type_vc: 'C'
    });

    if (String(source['kind'] || '') === 'purchases' && Array.isArray(source['headers']) && rows.length > 0) {
      this.hasPreview = true;
      this.headers = headers;
      this.rows = rows;
    }

    this.refresh();
  }

  public override old(key?: string, fallback: any = ''): any {
    const value = this.app.ui.old(key);
    return value === undefined ? fallback : value;
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public override linkAction(name: string, event: Event): void {
    super.linkAction(name, event);
  }

  public cellKey(column: number): string {
    return 'c' + column;
  }

  public rowFieldName(index: number, key: string): string {
    return 'rows[' + index + '][' + key + ']';
  }

  public rowValue(row: PreviewRow, key: string): string {
    const source = /^c\d+$/.test(key) ? row.cells : row.derived;
    const value = source[key];
    return value === undefined || value === null ? '' : String(value);
  }

  public issueFor(index: number): RowIssue | undefined {
    return this.validation.rowIssues[index];
  }

  public cellMessages(index: number, key: string): string[] {
    const issue = this.issueFor(index);
    const messages = issue && issue.cells[key];
    return messages || [];
  }

  public cellTitle(index: number, key: string): string | null {
    const messages = this.cellMessages(index, key);
    return messages.length ? messages.join('\n') : null;
  }

  public badgeLabel(index: number): string {
    const count = this.issueFor(index)?.count || 0;
    return count > 0 ? count + ' error' + (count === 1 ? '' : 'es') : 'Lista';
  }

  public badgeTitle(index: number): string {
    const issue = this.issueFor(index);
    return issue && issue.messages.length ? issue.messages.join('\n') : 'Fila lista para importar';
  }

  public requiredHeader(header: string): boolean {
    return REQUIRED.indexOf(header) !== -1;
  }

  public onCellInput(index: number, key: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const row = this.rows[index];
    if (!row) return;
    if (/^c\d+$/.test(key)) row.cells[key] = input.value;
    else row.derived[key] = input.value;
    this.refresh();
  }

  public onCellKeydown(event: Event, index: number, key: string): void {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key !== 'ArrowUp' && keyboard.key !== 'ArrowDown' && keyboard.key !== 'Enter') return;
    const input = event.target as HTMLInputElement | null;
    const body = input && input.closest('#sheet-body');
    if (!input || !body) return;
    const step = keyboard.key === 'ArrowUp' ? -1 : 1;
    const target = body.querySelector<HTMLInputElement>(
      'tr[data-row="' + (index + step) + '"] input[data-cell="' + key + '"]'
    );
    if (!target) return;
    keyboard.preventDefault();
    target.focus();
    target.select();
  }

  public addRow(): void {
    this.rows.push({ line: this.rows.length + 2, cells: {}, derived: {} });
    this.refresh();
    setTimeout(() => {
      const first = this.sheetBody?.nativeElement.querySelector<HTMLInputElement>('tr:last-child input[data-cell]');
      if (first) {
        first.focus();
        first.select();
      }
    });
  }

  public removeRow(index: number): void {
    if (this.rows.length <= 1) return;
    this.rows.splice(index, 1);
    this.refresh();
  }

  public refresh(): void {
    const payload = {
      month_register: this.month,
      year_register: this.year,
      type_vc: 'C',
      headers: this.headers,
      rows: this.rows
    };
    const result = this.store.validatePurchases(payload) as ValidationResult;
    this.validation = result;
    this.validRows = result.validRows;
    this.invalidRows = result.totalRows - result.validRows;
    const periodErrors = result.periodErrors || [];
    const rowErrors = result.errorCount - periodErrors.length;
    this.status = result.ok
      ? 'Sin errores: puedes procesar el archivo.'
      : (periodErrors.length ? periodErrors.join(' ') + (rowErrors ? ' ' : '') : '') +
        (rowErrors ? rowErrors + ' dato(s) requieren corrección. Las celdas marcadas en rojo contienen el detalle.' : '');

    let total = 0;
    let vat = 0;
    this.rows.forEach((row) => {
      const mapped = this.store.mapPurchaseRow(payload, row) as Record<string, unknown>;
      total += Number(mapped['total']) || 0;
      vat += Number(mapped['vat_rec']) || 0;
    });
    this.totalAmount = this.formatter.format(total);
    this.vatAmount = this.formatter.format(vat);
    this.processLabel = 'Procesar ' + this.rows.length + ' documento' + (this.rows.length === 1 ? '' : 's');
    this.canProcess = result.ok && this.rows.length > 0;
  }

  private normalizeHeaders(value: unknown[]): string[] {
    return value.map((header) => String(header ?? ''));
  }

  private normalizeRows(value: unknown[]): PreviewRow[] {
    return value.map((item, index) => {
      const raw = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const rawCells = raw['cells'] && typeof raw['cells'] === 'object' ? raw['cells'] as Record<string, unknown> : {};
      const rawDerived = raw['derived'] && typeof raw['derived'] === 'object' ? raw['derived'] as Record<string, unknown> : {};
      const row: PreviewRow = { line: Number(raw['line']) || index + 2, cells: {}, derived: {} };
      Object.keys(rawCells).forEach((key) => { row.cells[key] = String(rawCells[key] ?? ''); });
      Object.keys(rawDerived).forEach((key) => { row.derived[key] = String(rawDerived[key] ?? ''); });
      return row;
    });
  }

  private emptyValidation(): ValidationResult {
    return {
      ok: false,
      errorCount: 0,
      validRows: 0,
      totalRows: 0,
      rowIssues: [],
      periodErrors: []
    };
  }
}

export { IngressImportPurchasesPreviewComponent as ImportPurchasesPreviewComponent };
