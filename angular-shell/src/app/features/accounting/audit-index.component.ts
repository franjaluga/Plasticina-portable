import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface AuditRow {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  hasDocument: boolean;
  documentBadgeClass: string;
  documentFolio: string;
  documentType: string;
  showRutPlaceholder: boolean;
  rut: string;
  totalDebit: string;
  totalCredit: string;
}

@Component({
  standalone: true,
  selector: 'app-audit-index',
  templateUrl: './audit-index.component.html'
})
export class AuditIndexComponent extends ViewBaseComponent implements OnDestroy {
  public workingYear = '';
  public ownerName = 'N/A';
  public rows: AuditRow[] = [];

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
    super.submit(name, event);
  }

  private load(): void {
    const query = this.state.context.query || {};
    const workingYear = query['year'] === undefined || query['year'] === ''
      ? (this.store.workingYear ? this.store.workingYear() : new Date().getFullYear())
      : query['year'];
    this.workingYear = this.text(workingYear);
    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    this.ownerName = owner ? this.text(owner.name) : 'N/A';

    const journals = this.state.resource<unknown[]>('journals.audit', []);
    this.rows = this.list(journals).map((item) => this.toRow(item));
  }

  private toRow(value: unknown): AuditRow {
    const journal = this.object(value);
    const rawDocument = journal.document && typeof journal.document === 'object' ? journal.document : null;
    const doc = rawDocument ? this.object(rawDocument) : null;
    const entity = doc && doc.entity && typeof doc.entity === 'object' ? this.object(doc.entity) : null;

    return {
      id: this.text(journal.id),
      entryNumber: this.text(journal.entry_number),
      date: this.text(journal.date),
      description: this.text(journal.description),
      hasDocument: Boolean(doc),
      documentBadgeClass: doc
        ? 'px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200'
        : 'px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200',
      documentFolio: doc ? this.text(doc.folio) : '',
      documentType: doc ? this.text(doc.type_vc) : '',
      showRutPlaceholder: !entity,
      rut: entity ? this.text(entity.rut) : '',
      totalDebit: this.number(journal.total_debit),
      totalCredit: this.number(journal.total_credit)
    };
  }

  private text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private list(value: unknown): any[] {
    return Array.isArray(value) ? value : [];
  }

  private object(value: unknown): Record<string, any> {
    return value && typeof value === 'object' ? value as Record<string, any> : {};
  }
}
