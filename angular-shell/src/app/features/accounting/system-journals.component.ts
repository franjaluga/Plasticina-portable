import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface SelectOption {
  value: string;
  label: string;
}

interface JournalRow {
  id: string;
  detailHref: string;
  entryNumber: string;
  date: string;
  folio: string;
  description: string;
  rut: string;
  typeName: string;
  isPayment: boolean;
  folioRef: string;
  documentFolioRef: string;
  editHref: string;
  editClass: string;
  editTitle: string;
}

@Component({
  standalone: true,
  selector: 'app-system-journals',
  templateUrl: './system-journals.component.html',
  imports: [AppSelectComponent]
})
export class SystemJournalsComponent extends ViewBaseComponent implements OnDestroy {
  public query: Record<string, string> = {};
  public year = '';
  public startIso = '';
  public exportHref = '';
  public entryFrom = '';
  public entryTo = '';
  public dateFrom = '';
  public dateTo = '';
  public folioFrom = '';
  public folioTo = '';
  public rut = '';
  public documentTypeId = '';
  public folioRef = '';
  public documentTypeOptions: SelectOption[] = [];
  public rows: JournalRow[] = [];

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

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    if (event.defaultPrevented) return;
    const form = event.currentTarget instanceof HTMLFormElement ? event.currentTarget : null;
    const submitter = event instanceof SubmitEvent && event.submitter instanceof HTMLElement ? event.submitter : null;
    const message = (submitter && submitter.getAttribute('data-confirm')) || (form && form.getAttribute('data-confirm')) || '';
    if (message && !window.confirm(message)) {
      event.preventDefault();
      return;
    }
    const getRoute = this.app.config.getActions[name] || null;
    if (getRoute) {
      event.preventDefault();
      if (!form) return;
      const values = this.app.readForm(form);
      const rule = this.app.config.reportPeriodRoutes[getRoute];
      if (rule) {
        const status = this.app.reportPeriodStatus(getRoute, values as Record<string, string>);
        if (!status.allowed) {
          this.app.flash('error', this.app.periodHelp(status));
          this.app.refresh$.next();
          return;
        }
      }
      this.app.remember(values);
      this.goTo(name, values);
      return;
    }
    super.submit(name, event);
  }

  private load(): void {
    const query = this.state.context.query || {};
    this.query = { ...query };
    const workingYear = this.store.workingYear ? this.store.workingYear() : new Date().getFullYear();
    this.year = this.text(query['year'] === undefined || query['year'] === '' ? workingYear : query['year']);
    const start = this.store.ownerStartPeriod ? this.store.ownerStartPeriod() : null;
    const startYear = start && start.year !== undefined ? start.year : workingYear;
    const startMonth = start && start.month !== undefined ? start.month : 1;
    this.startIso = this.text(startYear) + '-' + this.pad(startMonth) + '-01';
    this.exportHref = this.route('accounting.system_journals.export_csv', this.query);

    this.entryFrom = this.text(this.old('entry_from', query['entry_from'] ?? ''));
    this.entryTo = this.text(this.old('entry_to', query['entry_to'] ?? ''));
    this.dateFrom = this.text(this.old('date_from', query['date_from'] ?? ''));
    this.dateTo = this.text(this.old('date_to', query['date_to'] ?? ''));
    this.folioFrom = this.text(this.old('folio_from', query['folio_from'] ?? ''));
    this.folioTo = this.text(this.old('folio_to', query['folio_to'] ?? ''));
    this.rut = this.text(this.old('rut', query['rut'] ?? ''));
    this.documentTypeId = this.text(this.old('document_type_id', query['document_type_id'] ?? ''));
    this.folioRef = this.text(this.old('folio_ref', query['folio_ref'] ?? ''));

    const documentTypes = this.state.resource<unknown[]>('catalogs.documentTypes', []);
    this.documentTypeOptions = [{ value: '', label: '-- Todos --' }].concat(
      this.list(documentTypes).map((item) => {
        const type = this.object(item);
        return { value: this.text(type.doctype), label: this.text(type.name) };
      })
    );

    const journals = this.state.resource<unknown[]>('journals.system', []);
    this.rows = this.list(journals).map((item) => this.toRow(item));
  }

  private toRow(value: unknown): JournalRow {
    const journal = this.object(value);
    const id = this.text(journal.id);
    const rawDocument = journal.document && typeof journal.document === 'object' ? journal.document : null;
    const doc = rawDocument ? this.object(rawDocument) : null;
    const rawPaid = journal.paidDocument && typeof journal.paidDocument === 'object' ? journal.paidDocument : null;
    const paid = rawPaid ? this.object(rawPaid) : null;
    const isPayment = Boolean(journal.ref_doc_payed && paid);
    const docFolio = doc ? doc.folio : '';
    const folio = isPayment ? '-' : (docFolio ? this.text(docFolio) : 'N/A (Manual)');
    const entity = doc && doc.entity && typeof doc.entity === 'object' ? this.object(doc.entity) : null;
    const paidEntity = paid && paid.entity && typeof paid.entity === 'object' ? this.object(paid.entity) : null;
    const rut = isPayment
      ? (paidEntity ? this.text(paidEntity.rut) : 'N/A')
      : (entity ? this.text(entity.rut) : 'N/A');
    const documentType = doc && doc.documentType && typeof doc.documentType === 'object' ? this.object(doc.documentType) : null;
    const paidDocumentType = paid && paid.documentType && typeof paid.documentType === 'object' ? this.object(paid.documentType) : null;
    const typeName = isPayment
      ? (paidDocumentType ? this.text(paidDocumentType.name) : 'Documento Pagado')
      : (documentType ? this.text(documentType.name) : 'Asiento Manual');
    const folioRef = isPayment
      ? (paid ? this.text(paid.folio) : '')
      : (doc && doc.folio_ref ? this.text(doc.folio_ref) : '-');
    const hasVcDocument = Boolean(journal.vc_document_id);

    return {
      id,
      detailHref: this.route('accounting.journals.detail', id),
      entryNumber: this.text(journal.entry_number),
      date: this.text(journal.closing_date || journal.date),
      folio,
      description: this.text(journal.description || 'Asiento automatizado'),
      rut,
      typeName,
      isPayment,
      folioRef,
      documentFolioRef: doc && doc.folio_ref ? this.text(doc.folio_ref) : '-',
      editHref: this.route(hasVcDocument ? 'accounting.journals.edit' : 'accounting.manual_journals.edit', id),
      editClass: (hasVcDocument
        ? 'bg-blue-50 hover:bg-blue-100 text-blue-600'
        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600') + ' font-bold px-2 py-1 rounded transition text-xs',
      editTitle: hasVcDocument ? 'Editar Asiento V/C' : 'Editar Asiento Manual'
    };
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
