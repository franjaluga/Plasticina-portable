import { Component, OnDestroy, OnInit } from '@angular/core';
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

interface PendingRow {
  id: string;
  folio: string;
  entityName: string;
  entityRut: string;
  typeLabel: string;
  typeClass: string;
  date: string;
  net: string;
  vatRec: string;
  total: string;
  account: string;
}

@Component({
  selector: 'app-document-pending',
  standalone: true,
  templateUrl: './document-pending.component.html',
  imports: [AppSelectComponent, AppAccountPickerComponent]
})
export class DocumentPendingComponent extends ViewBaseComponent implements OnInit, OnDestroy {
  public ownerId: number | string = '';
  public workingYear = new Date().getFullYear();
  public filterRut = '';
  public filterDocumentType = '';
  public filterDate = '';
  public filterFolio = '';
  public glosa = 'Contabilización de documentos V/C';
  public documents: PendingRow[] = [];
  public accounts: Array<Record<string, any>> = [];
  public documentTypeOptions: SelectOption[] = [{ value: '', label: 'Todos los tipos' }];
  public selectedIds: string[] = [];

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

  public get allSelected(): boolean {
    return this.documents.length > 0 && this.documents.every((row) => this.selectedIds.includes(row.id));
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public formatNumber(value: unknown): string {
    return this.number(value);
  }

  public onRutChange(value: string): void {
    this.filterRut = value;
  }

  public onDateChange(value: string): void {
    this.filterDate = value;
  }

  public onFolioChange(value: string): void {
    this.filterFolio = value;
  }

  public onDocumentTypeChange(value: string | number | null): void {
    this.filterDocumentType = value === null || value === undefined ? '' : String(value);
  }

  public onGlosaChange(value: string): void {
    this.glosa = value;
  }

  public isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  public toggleDocument(id: string, event: Event): void {
    const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
    if (checked) {
      if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
      return;
    }
    this.selectedIds = this.selectedIds.filter((value) => value !== id);
  }

  public toggleAll(event: Event): void {
    const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
    this.selectedIds = checked ? this.documents.map((row) => row.id) : [];
  }

  public onAccountChange(id: string, value: string): void {
    const row = this.documents.find((item) => item.id === id);
    if (row) row.account = value;
  }

  private load(): void {
    const query = this.ctx.query || {};
    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    this.ownerId = owner ? owner.id : '';
    this.workingYear = Number(this.store.workingYear ? this.store.workingYear() : new Date().getFullYear());

    this.filterRut = this.stored('rut', String(query['rut'] ?? ''));
    this.filterDocumentType = this.stored('document_type_id', String(query['document_type_id'] ?? ''));
    this.filterDate = this.stored('date', String(query['date'] ?? ''));
    this.filterFolio = this.stored('folio', String(query['folio'] ?? ''));
    this.glosa = this.stored('glosa', 'Contabilización de documentos V/C');

    const types = this.state.resource<unknown[]>('catalogs.documentTypes', []);
    this.documentTypeOptions = [{ value: '', label: 'Todos los tipos' }].concat(types.map((item: unknown) => {
      const row = item && typeof item === 'object' ? item as Record<string, any> : {};
      const doctype = String(row.doctype ?? '');
      return { value: doctype, label: doctype + ' - ' + String(row.name ?? '') };
    }));

    this.accounts = this.asAccounts(this.state.resource<unknown>('catalogs.accounts', null));
    if (!this.accounts.length && this.store.activeOwnerAccounts) {
      this.accounts = this.asAccounts(this.store.activeOwnerAccounts());
    }

    this.documents = this.state.resource<unknown[]>('documents.pending', []).map((item: unknown) => {
      const doc = item && typeof item === 'object' ? item as Record<string, any> : {};
      const entity = doc.entity && typeof doc.entity === 'object' ? doc.entity as Record<string, any> : {};
      const id = String(doc.id ?? '');
      const typeVc = String(doc.type_vc ?? '');
      return {
        id,
        folio: String(doc.folio ?? ''),
        entityName: String(entity.name ?? 'S/N'),
        entityRut: String(entity.rut ?? ''),
        typeLabel: typeVc === 'V' ? 'Venta' : 'Compra',
        typeClass: typeVc === 'V' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800',
        date: String(doc.date ?? ''),
        net: this.formatNumber(doc.net),
        vatRec: this.formatNumber(doc.vat_rec),
        total: this.formatNumber(doc.total),
        account: this.accountCode(id)
      };
    });

    const available = this.documents.map((row) => row.id);
    this.selectedIds = this.selectedIds.filter((id) => available.includes(id));
  }

  private accountCode(id: string): string {
    return this.stored('custom_net_account[' + id + '][code]', '');
  }

  private stored(key: string, fallback: string): string {
    const value = this.previous[key];
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }

  private asAccounts(value: unknown): Array<Record<string, any>> {
    if (Array.isArray(value)) return value as Array<Record<string, any>>;
    if (value && typeof value === 'object' && Array.isArray((value as { accounts?: unknown }).accounts)) {
      return (value as { accounts: Array<Record<string, any>> }).accounts;
    }
    return [];
  }
}
