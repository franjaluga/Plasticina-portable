import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface EntryRow {
  accountCode: string;
  accountName: string;
  componentName: string;
  debit: string;
  credit: string;
}

@Component({
  standalone: true,
  selector: 'app-journal-detail',
  templateUrl: './journal-detail.component.html'
})
export class JournalDetailComponent extends ViewBaseComponent implements OnDestroy {
  public id = '';
  public entryNumber = '';
  public year = '';
  public date = '';
  public sourceLabel = '';
  public glosa = '';
  public hasGlosa = false;
  public isBalanced = false;
  public statusClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-800';
  public statusLabel = '● Descuadrado';
  public hasEntity = false;
  public entityName = '';
  public entityRut = '';
  public entries: EntryRow[] = [];
  public totalDebit = '';
  public totalCredit = '';

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
    const paramId = this.text(this.state.context.params['id']);
    const value = this.state.resource<unknown>('journals.detail', {});
    const journal = this.object(value);
    const rawDocument = journal.document && typeof journal.document === 'object' ? journal.document : null;
    const doc = rawDocument ? this.object(rawDocument) : null;

    this.id = this.text(journal.id || paramId);
    this.entryNumber = this.text(journal.entry_number);
    this.year = this.text(journal.year);
    this.date = this.text(journal.date);
    this.sourceLabel = journal.vc_document_id
      ? 'Documento V/C (ID: ' + this.text(journal.vc_document_id) + ')'
      : 'Asiento Manual / Pago';
    this.isBalanced = Boolean(journal.is_balanced);
    this.statusClass = this.isBalanced
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-800';
    this.statusLabel = this.isBalanced ? '● Cuadrado' : '● Descuadrado';

    const glosa = this.text(journal.description || journal.glosa ||
      (doc ? (doc.description || doc.glosa || doc.obs) : '') || '');
    this.glosa = glosa;
    this.hasGlosa = Boolean(glosa);

    const entity = doc && doc.entity && typeof doc.entity === 'object' ? this.object(doc.entity) : null;
    this.hasEntity = Boolean(entity);
    this.entityName = entity ? this.text(entity.name) : '';
    this.entityRut = entity ? this.text(entity.rut) : '';

    this.entries = this.list(journal.entries).map((item) => this.toEntry(item));
    this.totalDebit = this.number(journal.total_debit);
    this.totalCredit = this.number(journal.total_credit);
  }

  private toEntry(value: unknown): EntryRow {
    const entry = this.object(value);
    const rawAccount = entry.account && typeof entry.account === 'object' ? entry.account : null;
    const account = rawAccount ? this.object(rawAccount) : null;
    const accountName = account && account.name ? this.text(account.name) : 'Cuenta Sin Nombre';
    return {
      accountCode: this.text(entry.account_code),
      accountName,
      componentName: this.capitalize(entry.component_name),
      debit: this.amountOrDash(entry.debit),
      credit: this.amountOrDash(entry.credit)
    };
  }

  private amountOrDash(value: unknown): string {
    return Number(value || 0) ? this.number(value) : '-';
  }

  private capitalize(value: unknown): string {
    const text = this.text(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
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
