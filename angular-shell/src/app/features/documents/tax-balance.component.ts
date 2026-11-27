import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface BalanceRow {
  code: string;
  name: string;
  sumDebit: string;
  sumCredit: string;
  balanceDebit: string;
  balanceCredit: string;
  activo: string;
  pasivo: string;
  perdida: string;
  ganancia: string;
}

interface BalanceFigures {
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
}

@Component({
  selector: 'app-tax-balance',
  standalone: true,
  templateUrl: './tax-balance.component.html'
})
export class TaxBalanceComponent extends ViewBaseComponent implements OnInit, OnDestroy {
  public month = 1;
  public year = new Date().getFullYear();
  public lastDay = 1;
  public dateFrom = '';
  public dateTo = '';
  public ownerName = 'Sin Empresa';
  public ownerRut = 'N/A';
  public rows: BalanceRow[] = [];
  public figures: BalanceFigures = {
    sumSd: 0, sumSc: 0, sumBd: 0, sumBc: 0,
    sumAct: 0, sumPas: 0, sumPer: 0, sumGan: 0,
    resPerdida: 0, resGanancia: 0, resActivo: 0, resPasivo: 0,
    totalInvActivo: 0, totalInvPasivo: 0, totalResPerdida: 0, totalResGanancia: 0
  };

  private readonly previous: Record<string, unknown>;
  private readonly subscription = new Subscription();

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const stored = this.app.ui.old();
    this.previous = stored && typeof stored === 'object' ? stored as Record<string, unknown> : {};
  }

  public ngOnInit(): void {
    this.subscription.add(this.state.state$.subscribe(() => this.load()));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public get resultLabel(): string {
    return this.figures.sumGan > this.figures.sumPer ? 'Utilidad' : 'Pérdida';
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override back(): void {
    super.back();
  }

  public format0(value: unknown): string {
    return this.number(value);
  }

  public format0OrDash(value: unknown): string {
    return this.num(value) ? this.number(value) : '-';
  }

  private load(): void {
    const query = this.ctx.query || {};
    const today = this.app.ui.today();
    const rawMonth = Number(this.stored('month', String(query['month'] ?? '')));
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth
      : Number(today.slice(5, 7));
    const rawYear = Number(this.stored('year', String(query['year'] ?? '')));
    const workingYear = Number(this.store.workingYear ? this.store.workingYear() : today.slice(0, 4));
    const year = Number.isInteger(rawYear) && rawYear >= 2000 ? rawYear : workingYear;

    this.month = month;
    this.year = year;
    this.lastDay = new Date(year, month, 0).getDate();
    this.dateFrom = year + '-01-01';
    this.dateTo = year + '-' + this.pad(month) + '-' + this.pad(this.lastDay);

    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    this.ownerName = owner ? String(owner.name ?? 'Sin Empresa') : 'Sin Empresa';
    this.ownerRut = owner ? String(owner.rut ?? 'N/A') : 'N/A';

    const source = this.state.resource<unknown[]>('reports.taxBalance', []);
    this.rows = source.map((item: unknown) => {
      const row = item && typeof item === 'object' ? item as Record<string, any> : {};
      return {
        code: String(row.code ?? ''),
        name: String(row.name ?? ''),
        sumDebit: this.format0OrDash(row.sum_debit),
        sumCredit: this.format0OrDash(row.sum_credit),
        balanceDebit: this.format0OrDash(row.balance_debit),
        balanceCredit: this.format0OrDash(row.balance_credit),
        activo: this.format0OrDash(row.activo),
        pasivo: this.format0OrDash(row.pasivo),
        perdida: this.format0OrDash(row.perdida),
        ganancia: this.format0OrDash(row.ganancia)
      };
    });
    this.figures = this.taxFigures(source);
  }

  private taxFigures(rows: unknown[]): BalanceFigures {
    const figures: BalanceFigures = {
      sumSd: 0, sumSc: 0, sumBd: 0, sumBc: 0,
      sumAct: 0, sumPas: 0, sumPer: 0, sumGan: 0,
      resPerdida: 0, resGanancia: 0, resActivo: 0, resPasivo: 0,
      totalInvActivo: 0, totalInvPasivo: 0, totalResPerdida: 0, totalResGanancia: 0
    };
    rows.forEach((item: unknown) => {
      const row = item && typeof item === 'object' ? item as Record<string, any> : {};
      figures.sumSd += this.num(row.sum_debit);
      figures.sumSc += this.num(row.sum_credit);
      figures.sumBd += this.num(row.balance_debit);
      figures.sumBc += this.num(row.balance_credit);
      figures.sumAct += this.num(row.activo);
      figures.sumPas += this.num(row.pasivo);
      figures.sumPer += this.num(row.perdida);
      figures.sumGan += this.num(row.ganancia);
    });
    const difference = Math.abs(figures.sumPer - figures.sumGan);
    if (figures.sumGan > figures.sumPer) {
      figures.resPerdida = difference;
      figures.resPasivo = difference;
    } else if (figures.sumPer > figures.sumGan) {
      figures.resGanancia = difference;
      figures.resActivo = difference;
    }
    figures.totalInvActivo = figures.sumAct + figures.resActivo;
    figures.totalInvPasivo = figures.sumPas + figures.resPasivo;
    figures.totalResPerdida = figures.sumPer + figures.resPerdida;
    figures.totalResGanancia = figures.sumGan + figures.resGanancia;
    return figures;
  }

  private num(value: unknown): number {
    return Number(value || 0);
  }

  public pad(value: unknown): string {
    return String(value).padStart(2, '0');
  }

  private stored(key: string, fallback: string): string {
    const value = this.previous[key];
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }
}
