import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  templateUrl: './document-detail.component.html'
})
export class DocumentDetailComponent extends ViewBaseComponent implements OnInit, OnDestroy {
  public folio = '';
  public typeVc = '';
  public monthRegister = '';
  public yearRegister = '';
  public date = '';
  public journalText = 'Pendiente';
  public journalClass = 'text-amber-600';
  public entityRut = 'N/A';
  public entityName = 'Sin nombre registrado';
  public documentTypeId = 'N/A';
  public documentTypeDescription = 'Sin nombre registrado';
  public rutRef = '-';
  public folioRef = '-';
  public tdRef = '-';
  public dateCentralize = '-';
  public net = '0';
  public exempt = '0';
  public vatRec = '0';
  public vatNoRec = '0';
  public plusOthTax = '0';
  public minusOthTax = '0';
  public total = '0';

  private readonly subscription = new Subscription();

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
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
    const value = this.state.resource<unknown>('documents.detail', null);
    const document = value && typeof value === 'object' ? value as Record<string, any> : {};
    const entity = document.entity && typeof document.entity === 'object'
      ? document.entity as Record<string, any>
      : null;
    const docType = document.documentType && typeof document.documentType === 'object'
      ? document.documentType as Record<string, any>
      : {};
    const rawTypeId = document.document_type_id;
    const hasJournal = !!document.journal;

    this.folio = String(document.folio ?? '');
    this.typeVc = String(document.type_vc ?? '');
    this.monthRegister = String(document.month_register ?? '');
    this.yearRegister = String(document.year_register ?? '');
    this.date = String(document.date ?? '');
    this.journalText = hasJournal ? 'Sí' : 'Pendiente';
    this.journalClass = hasJournal ? 'text-green-600' : 'text-amber-600';
    this.entityRut = entity ? String(entity.rut ?? 'N/A') : 'N/A';
    this.entityName = entity ? String(entity.name ?? 'Sin nombre registrado') : 'Sin nombre registrado';
    this.documentTypeId = rawTypeId === undefined || rawTypeId === null || rawTypeId === ''
      ? 'N/A'
      : String(rawTypeId);
    this.documentTypeDescription = String(docType.name || docType.description || 'Sin nombre registrado');
    this.rutRef = String(document.rut_ref || '-');
    this.folioRef = String(document.folio_ref || '-');
    this.tdRef = String(document.td_ref || '-');
    this.dateCentralize = String(document.date_centralize || '-');
    this.net = this.format0(document.net);
    this.exempt = this.format0(document.exempt);
    this.vatRec = this.format0(document.vat_rec);
    this.vatNoRec = this.format0(document.vat_no_rec);
    this.plusOthTax = this.format0(document.plus_oth_tax);
    this.minusOthTax = this.format0(document.minus_oth_tax);
    this.total = this.format0(document.total);
  }

  private format0(value: unknown): string {
    return this.number(value);
  }
}
