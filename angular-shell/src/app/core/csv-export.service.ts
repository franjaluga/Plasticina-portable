import { Injectable } from '@angular/core';
import { DownloadService } from './download.service';
import { PlasticinaService } from './plasticina.service';

type CsvRow = unknown[];
type Journal = Record<string, any>;
type BalanceRow = Record<string, any>;

type TaxPeriod = {
  month: number;
  year: number;
  lastDay: number;
  dateFrom: string;
  dateTo: string;
};

type TaxFigures = {
  sumSd: number;
  sumSc: number;
  sumBd: number;
  sumBc: number;
  sumAct: number;
  sumPas: number;
  sumPer: number;
  sumGan: number;
  resPerdida: number;
  resGanancia: number;
  resActivo: number;
  resPasivo: number;
  totalInvActivo: number;
  totalInvPasivo: number;
  totalResPerdida: number;
  totalResGanancia: number;
};

const SYSTEM_FILTER_KEYS = [
  'entry_from', 'entry_to', 'date_from', 'date_to', 'folio_from', 'folio_to', 'rut', 'document_type_id', 'folio_ref'
];

const TAX_BALANCE_NOTE = 'Art. 100 del Código Tributario, los antecedentes fueron presentados ante mí como fidedignos.';

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  constructor(
    private readonly app: PlasticinaService,
    private readonly download: DownloadService
  ) {}

  exportSystemJournalsCsv(query: Record<string, string>): void {
    const options = this.systemJournalOptions(query);
    const journals = this.app.store.systemJournals(options.year, options.filters) || [];
    const filename = 'asientos_sistema_' + this.stamp() + '.csv';
    this.download.download([this.toCsv(this.buildRows(journals))], filename, 'text/csv;charset=utf-8');
    this.app.flash('success', 'Asientos del sistema exportados en CSV.');
    this.goTo('accounting.system_journals', query || {});
  }

  exportTaxBalanceCsv(query: Record<string, string>): void {
    const period = this.taxBalancePeriod(query);
    const balanceRows = this.app.store.taxBalance(period.year, {
      date_from: period.dateFrom,
      date_to: period.dateTo
    }) || [];
    const filename = 'balance_tributario_' + period.year + '-' + this.pad(period.month) + '_' + this.stamp() + '.csv';
    this.download.download(
      [this.toCsv(this.taxBalanceRows(balanceRows, period, this.app.store.activeOwner()))],
      filename,
      'text/csv;charset=utf-8'
    );
    this.app.flash('success', 'Balance tributario exportado en CSV.');
    this.goTo('vc_documents.tax_balance', query || {});
  }

  private csvCell(value: unknown): string {
    const text = String(value === null || value === undefined ? '' : value);
    return /[;"\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  private journalRow(journal: Journal, entry: Journal): CsvRow {
    return [
      journal.id,
      journal.closing_date || journal.date,
      journal.description || 'Sin descripción',
      journal.vc_document_id || '',
      journal.is_balanced ? 'Cuadrado' : 'Descuadrado',
      entry.account_code,
      entry.account ? entry.account.name : 'Sin nombre',
      entry.debit,
      entry.credit
    ];
  }

  private journalSeparator(): CsvRow {
    return ['---', '---', '---', '---', '---', '---', '---', '---', '---'];
  }

  private buildRows(journals: Journal[]): CsvRow[] {
    const rows: CsvRow[] = [[
      'Asiento ID', 'Fecha', 'Glosa', 'Doc V/C ID', 'Estado', 'Codigo Cuenta', 'Componente', 'Debe', 'Haber'
    ]];
    journals.forEach((journal, index) => {
      const entries = Array.isArray(journal.entries) ? journal.entries : [];
      entries.forEach((entry: Journal) => {
        rows.push(this.journalRow(journal, entry));
      });
      if (index < journals.length - 1) rows.push(this.journalSeparator());
    });
    return rows;
  }

  private toCsv(rows: CsvRow[]): string {
    return '\uFEFF' + rows.map((row) => row.map((value) => this.csvCell(value)).join(';')).join('\r\n');
  }

  private systemJournalOptions(query: Record<string, string>): { year: unknown; filters: Record<string, string> } {
    const source = query || {};
    const year = source.year === undefined || source.year === '' ? this.app.store.workingYear() : source.year;
    const filters: Record<string, string> = {};
    SYSTEM_FILTER_KEYS.forEach((key) => {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') filters[key] = value;
    });
    return { year, filters };
  }

  private pad(value: unknown): string {
    return String(value).padStart(2, '0');
  }

  private csvNumber(value: unknown): number {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  private taxBalancePeriod(query: Record<string, string>): TaxPeriod {
    const source = query || {};
    const rawMonth = Number(source.month);
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth : Number(this.app.ui.today().slice(5, 7));
    const rawYear = Number(source.year);
    const year = Number.isInteger(rawYear) && rawYear >= 2000 ? rawYear : Number(this.app.store.workingYear());
    const lastDay = new Date(year, month, 0).getDate();
    return {
      month,
      year,
      lastDay,
      dateFrom: year + '-01-01',
      dateTo: year + '-' + this.pad(month) + '-' + this.pad(lastDay)
    };
  }

  private num(value: unknown): number {
    return Number(value || 0);
  }

  private taxBalanceFigures(balanceRows: BalanceRow[]): TaxFigures {
    const figures: TaxFigures = {
      sumSd: 0, sumSc: 0, sumBd: 0, sumBc: 0,
      sumAct: 0, sumPas: 0, sumPer: 0, sumGan: 0,
      resPerdida: 0, resGanancia: 0, resActivo: 0, resPasivo: 0,
      totalInvActivo: 0, totalInvPasivo: 0, totalResPerdida: 0, totalResGanancia: 0
    };
    (balanceRows || []).forEach((row) => {
      figures.sumSd += this.num(row.sum_debit);
      figures.sumSc += this.num(row.sum_credit);
      figures.sumBd += this.num(row.balance_debit);
      figures.sumBc += this.num(row.balance_credit);
      figures.sumAct += this.num(row.activo);
      figures.sumPas += this.num(row.pasivo);
      figures.sumPer += this.num(row.perdida);
      figures.sumGan += this.num(row.ganancia);
    });
    const diffResult = Math.abs(figures.sumPer - figures.sumGan);
    if (figures.sumGan > figures.sumPer) {
      figures.resPerdida = diffResult;
      figures.resPasivo = diffResult;
    } else if (figures.sumPer > figures.sumGan) {
      figures.resGanancia = diffResult;
      figures.resActivo = diffResult;
    }
    figures.totalInvActivo = figures.sumAct + figures.resActivo;
    figures.totalInvPasivo = figures.sumPas + figures.resPasivo;
    figures.totalResPerdida = figures.sumPer + figures.resPerdida;
    figures.totalResGanancia = figures.sumGan + figures.resGanancia;
    return figures;
  }

  private taxBalanceRows(balanceRows: BalanceRow[], period: TaxPeriod, owner: Journal | null): CsvRow[] {
    const figures = this.taxBalanceFigures(balanceRows);
    const periodLabel = '01/01/' + period.year + ' al ' + this.pad(period.lastDay) + '/' +
      this.pad(period.month) + '/' + period.year;
    const rows: CsvRow[] = [
      ['Empresa', owner ? owner.name : 'Sin Empresa'],
      ['RUT', owner ? owner.rut : 'N/A'],
      ['Periodo Comercial', periodLabel],
      [
        'Código', 'Cuenta Contable', 'Sumas Débito', 'Sumas Crédito',
        'Saldos Deudor', 'Saldos Acreedor', 'Inventario Activo', 'Inventario Pasivo',
        'Resultados Pérdida', 'Resultados Ganancia'
      ]
    ];
    (balanceRows || []).forEach((row) => {
      rows.push([
        row.code, row.name,
        this.csvNumber(row.sum_debit), this.csvNumber(row.sum_credit),
        this.csvNumber(row.balance_debit), this.csvNumber(row.balance_credit),
        this.csvNumber(row.activo), this.csvNumber(row.pasivo),
        this.csvNumber(row.perdida), this.csvNumber(row.ganancia)
      ]);
    });
    if (balanceRows && balanceRows.length) {
      rows.push([
        'Sumas', '',
        this.csvNumber(figures.sumSd), this.csvNumber(figures.sumSc),
        this.csvNumber(figures.sumBd), this.csvNumber(figures.sumBc),
        this.csvNumber(figures.sumAct), this.csvNumber(figures.sumPas),
        this.csvNumber(figures.sumPer), this.csvNumber(figures.sumGan)
      ]);
      rows.push([
        'Resultado del Ejercicio (' + (figures.sumGan > figures.sumPer ? 'Utilidad' : 'Pérdida') + ')',
        '', '', '', '', '',
        this.csvNumber(figures.resActivo), this.csvNumber(figures.resPasivo),
        this.csvNumber(figures.resPerdida), this.csvNumber(figures.resGanancia)
      ]);
      rows.push([
        'Sumas Iguales', '',
        this.csvNumber(figures.sumSd), this.csvNumber(figures.sumSc),
        this.csvNumber(figures.sumBd), this.csvNumber(figures.sumBc),
        this.csvNumber(figures.totalInvActivo), this.csvNumber(figures.totalInvPasivo),
        this.csvNumber(figures.totalResPerdida), this.csvNumber(figures.totalResGanancia)
      ]);
    }
    rows.push([TAX_BALANCE_NOTE]);
    return rows;
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  private goTo(routeName: string, query: Record<string, string>): void {
    this.app.navigate(this.app.route(routeName, query || {}));
  }
}
