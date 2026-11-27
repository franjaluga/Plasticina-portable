import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface QueryRow {
  id: string;
  folio: string;
  date: string;
  entityRut: string;
  entityName: string;
  documentTypeId: string;
  documentTypeName: string;
  net: string;
  exempt: string;
  vatRec: string;
  plusOthTax: string;
  minusOthTax: string;
  total: string;
}

interface QueryTotals {
  net: string;
  exempt: string;
  vatRec: string;
  plusOthTax: string;
  minusOthTax: string;
  total: string;
}

@Component({
  selector: 'app-document-query-results',
  standalone: true,
  templateUrl: './document-query-results.component.html'
})
export class DocumentQueryResultsComponent extends ViewBaseComponent implements OnInit, OnDestroy {
  public typeVc = 'V';
  public typeLabel = 'Ventas';
  public month = 1;
  public year = new Date().getFullYear();
  public period = '';
  public documents: QueryRow[] = [];
  public totals: QueryTotals = {
    net: '0', exempt: '0', vatRec: '0', plusOthTax: '0', minusOthTax: '0', total: '0'
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

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override back(): void {
    super.back();
  }

  private load(): void {
    const query = this.ctx.query || {};
    const type = this.stored('type_vc', String(query['type_vc'] ?? ''));
    this.typeVc = type === '' ? 'V' : type;
    this.typeLabel = String(this.typeVc).toUpperCase() === 'V' ? 'Ventas' : 'Compras';

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
    this.period = this.pad(month) + ' / ' + String(year);

    const source = this.state.resource<unknown[]>('documents.query', []);
    this.documents = source.map((item: unknown) => {
      const doc = item && typeof item === 'object' ? item as Record<string, any> : {};
      const entity = doc.entity && typeof doc.entity === 'object' ? doc.entity as Record<string, any> : null;
      const docType = doc.documentType && typeof doc.documentType === 'object'
        ? doc.documentType as Record<string, any>
        : {};
      return {
        id: String(doc.id ?? ''),
        folio: String(doc.folio ?? ''),
        date: String(doc.date ?? ''),
        entityRut: entity ? String(entity.rut ?? 'N/A') : 'N/A',
        entityName: entity ? String(entity.name ?? 'Sin nombre') : 'Sin nombre',
        documentTypeId: String(doc.document_type_id ?? ''),
        documentTypeName: String(docType.name || docType.description || ''),
        net: this.format0(doc.net),
        exempt: this.format0(doc.exempt),
        vatRec: this.format0(doc.vat_rec),
        plusOthTax: this.format0(doc.plus_oth_tax),
        minusOthTax: this.format0(doc.minus_oth_tax),
        total: this.format0(doc.total)
      };
    });

    this.totals = {
      net: this.format0(this.sum(source, 'net')),
      exempt: this.format0(this.sum(source, 'exempt')),
      vatRec: this.format0(this.sum(source, 'vat_rec')),
      plusOthTax: this.format0(this.sum(source, 'plus_oth_tax')),
      minusOthTax: this.format0(this.sum(source, 'minus_oth_tax')),
      total: this.format0(this.sum(source, 'total'))
    };
  }

  private format0(value: unknown): string {
    return this.number(value);
  }

  private sum(rows: unknown[], field: string): number {
    return rows.reduce((total: number, item: unknown) => {
      const row = item && typeof item === 'object' ? item as Record<string, any> : {};
      return total + Number(row[field] || 0);
    }, 0);
  }

  private pad(value: unknown): string {
    return String(value).padStart(2, '0');
  }

  private stored(key: string, fallback: string): string {
    const value = this.previous[key];
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }
}
