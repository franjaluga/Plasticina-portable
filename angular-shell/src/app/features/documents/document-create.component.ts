import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface DocumentTypeRecord {
  doctype: string | number;
  name: string;
}

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-document-create',
  standalone: true,
  templateUrl: './document-create.component.html',
  imports: [AppSelectComponent]
})
export class DocumentCreateComponent extends ViewBaseComponent {
  public readonly fieldClass = 'mt-1 block w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 transition';
  public readonly amountClass = this.fieldClass + ' text-right font-mono';
  public readonly totalClass = 'mt-1 block w-full min-w-0 rounded-lg border border-gray-400 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm outline-none border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 text-right font-mono transition';
  public readonly labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1';
  public readonly sectionClass = 'text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200';
  public readonly messageDefaultClass = 'text-xs mt-2 leading-tight text-gray-500';
  public readonly messageSuccessClass = 'text-xs mt-2 leading-tight text-green-600 font-medium';
  public readonly messageInfoClass = 'text-xs mt-2 leading-tight text-blue-600 font-medium';

  public readonly typeOptions: SelectOption[] = [
    { value: 'V', label: 'Venta' },
    { value: 'C', label: 'Compra' }
  ];

  public ownerId: number | string = '';
  public monthRegister: string;
  public yearRegister: string;
  public typeVc: string;
  public rut: string;
  public entityName: string;
  public doctype: string;
  public documentTypeName: string;
  public folio: string;
  public date: string;
  public rutRef: string;
  public folioRef: string;
  public tdRef: string;
  public dateCentralize: string;
  public net: string;
  public exempt: string;
  public vatRec: string;
  public vatNoRec: string;
  public plusOthTax: string;
  public minusOthTax: string;
  public total: string;
  public rutMessage = '';
  public rutMessageClass = this.messageDefaultClass;
  public doctypeMessage = '';
  public doctypeMessageClass = this.messageDefaultClass;
  public documentTypes: DocumentTypeRecord[] = [];

  private readonly previous: Record<string, unknown>;
  private autoRutRef = false;
  private autoTdRef = false;
  private autoFolioRef = false;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const stored = this.app.ui.old();
    this.previous = stored && typeof stored === 'object' ? stored as Record<string, unknown> : {};

    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    this.ownerId = owner ? owner.id : '';
    const workingYear = Number(this.store.workingYear ? this.store.workingYear() : new Date().getFullYear());

    this.monthRegister = this.stored('month_register', String(new Date().getMonth() + 1));
    this.yearRegister = this.stored('year_register', String(workingYear));
    this.typeVc = this.stored('type_vc', 'V');
    this.rut = this.stored('rut', '');
    this.entityName = this.stored('entity_name', '');
    this.doctype = this.stored('doctype', '');
    this.documentTypeName = this.stored('document_type_name', '');
    this.folio = this.stored('folio', '');
    this.date = this.stored('date', '');
    this.rutRef = this.stored('rut_ref', '');
    this.folioRef = this.stored('folio_ref', '');
    this.tdRef = this.stored('td_ref', '');
    this.dateCentralize = this.stored('date_centralize', this.monthEnd(workingYear));
    this.net = this.stored('net', '0');
    this.exempt = this.stored('exempt', '0');
    this.vatRec = this.stored('vat_rec', '0');
    this.vatNoRec = this.stored('vat_no_rec', '0');
    this.plusOthTax = this.stored('plus_oth_tax', '0');
    this.minusOthTax = this.stored('minus_oth_tax', '0');
    this.total = this.stored('total', '0');

    this.documentTypes = this.normalizeTypes(this.state.resource<unknown[]>('catalogs.documentTypes', []));
    if (!this.documentTypes.length && this.store.documentTypes) {
      this.documentTypes = this.normalizeTypes(this.store.documentTypes());
    }
    if (!this.documentTypes.length) {
      Promise.resolve(this.app.data.resolve('catalogs.documentTypes', this.ctx))
        .then((value: unknown) => { this.documentTypes = this.normalizeTypes(value); })
        .catch(() => undefined);
    }

    this.syncReferences();
    if (!this.total || Number(this.total) === 0) this.calculateTotal();
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public override back(): void {
    super.back();
  }

  public onTypeVcChange(value: string | number | null): void {
    this.typeVc = value === null || value === undefined ? '' : String(value);
  }

  public onRutInput(value: string): void {
    this.rut = value;
    this.syncReferences();
  }

  public onDoctypeInput(value: string): void {
    this.doctype = value;
    this.syncReferences();
  }

  public onFolioInput(value: string): void {
    this.folio = value;
    this.syncReferences();
  }

  public onRutRefInput(value: string): void {
    this.rutRef = value;
    this.autoRutRef = false;
  }

  public onTdRefInput(value: string): void {
    this.tdRef = value;
    this.autoTdRef = false;
  }

  public onFolioRefInput(value: string): void {
    this.folioRef = value;
    this.autoFolioRef = false;
  }

  public onAmountInput(): void {
    this.calculateTotal();
  }

  public onRutBlur(): void {
    this.syncReferences();
    const rutValue = this.rut.trim();
    if (!rutValue) {
      this.rutMessage = '';
      this.rutMessageClass = this.messageDefaultClass;
      return;
    }
    this.rutMessage = 'Buscando...';
    this.rutMessageClass = this.messageDefaultClass;
    const entity = this.store.entityByRut ? this.store.entityByRut(rutValue) : null;
    if (entity) {
      this.entityName = String(entity.name ?? '');
      this.rutMessage = 'Entidad cargada. Puede ajustar el nombre si es necesario.';
      this.rutMessageClass = this.messageSuccessClass;
      return;
    }
    this.entityName = '';
    this.rutMessage = 'RUT nuevo. Ingrese el nombre para registrarlo.';
    this.rutMessageClass = this.messageInfoClass;
  }

  public onDoctypeBlur(): void {
    this.syncReferences();
    const doctypeValue = this.doctype.trim();
    if (!doctypeValue) {
      this.doctypeMessage = '';
      this.doctypeMessageClass = this.messageDefaultClass;
      return;
    }
    this.doctypeMessage = 'Buscando...';
    this.doctypeMessageClass = this.messageDefaultClass;
    const known = this.store.documentTypeByDoctype ? this.store.documentTypeByDoctype(doctypeValue) : null;
    const row = known || this.documentTypes.find((item) => String(item.doctype) === doctypeValue);
    if (row) {
      this.documentTypeName = String(row.name ?? '');
      this.doctypeMessage = 'Tipo de documento cargado. Puede ajustar el nombre si es necesario.';
      this.doctypeMessageClass = this.messageSuccessClass;
      return;
    }
    this.documentTypeName = '';
    this.doctypeMessage = 'Código nuevo. Ingrese el nombre para registrarlo.';
    this.doctypeMessageClass = this.messageInfoClass;
  }

  private stored(key: string, fallback: string): string {
    const value = this.previous[key];
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }

  private syncReferences(): void {
    const code = this.doctype.trim();
    if (code === '33' || code === '34') {
      const rutValue = this.rut.trim();
      if (rutValue && (!this.rutRef || this.autoRutRef)) {
        this.rutRef = rutValue;
        this.autoRutRef = true;
      }
      if (!this.tdRef || this.autoTdRef) {
        this.tdRef = code;
        this.autoTdRef = true;
      }
      const folioValue = this.folio.trim();
      if (folioValue && (!this.folioRef || this.autoFolioRef)) {
        this.folioRef = folioValue;
        this.autoFolioRef = true;
      }
      return;
    }
    if (this.autoRutRef) {
      this.rutRef = '';
      this.autoRutRef = false;
    }
    if (this.autoTdRef) {
      this.tdRef = '';
      this.autoTdRef = false;
    }
    if (this.autoFolioRef) {
      this.folioRef = '';
      this.autoFolioRef = false;
    }
  }

  private calculateTotal(): void {
    const sum = this.amount(this.net) + this.amount(this.exempt) + this.amount(this.vatRec) +
      this.amount(this.vatNoRec) + this.amount(this.plusOthTax) - this.amount(this.minusOthTax);
    this.total = String(Math.round((sum + Number.EPSILON) * 100) / 100);
  }

  private amount(value: string): number {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private monthEnd(year: number): string {
    const current = new Date();
    const end = new Date(year, current.getMonth() + 1, 0);
    return String(year) + '-' + this.pad(end.getMonth() + 1) + '-' + this.pad(end.getDate());
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  private normalizeTypes(value: unknown): DocumentTypeRecord[] {
    const source = Array.isArray(value)
      ? value
      : (value && typeof value === 'object' && Array.isArray((value as { documentTypes?: unknown }).documentTypes)
        ? (value as { documentTypes: unknown[] }).documentTypes
        : []);
    return source
      .map((item: unknown) => {
        const row = item && typeof item === 'object' ? item as Record<string, any> : {};
        return {
          doctype: row.doctype === undefined || row.doctype === null ? '' : row.doctype,
          name: String(row.name ?? '')
        };
      })
      .filter((item: DocumentTypeRecord) => String(item.doctype) !== '');
  }
}
