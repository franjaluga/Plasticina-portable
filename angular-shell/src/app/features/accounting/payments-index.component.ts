import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppAccountPickerComponent } from '../../shared/ui/app-account-picker.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface PaymentDocument {
  id: string;
  isSale: boolean;
  badgeClass: string;
  folio: string;
  date: string;
  total: string;
  paid: string;
  balance: string;
  rawBalance: string;
  dateValue: string;
  amount: string;
}

@Component({
  standalone: true,
  selector: 'app-payments-index',
  templateUrl: './payments-index.component.html',
  imports: [AppAccountPickerComponent]
})
export class PaymentsIndexComponent extends ViewBaseComponent {
  public ownerName = '';
  public accounts: Array<Record<string, any>> = [];
  public documents: PaymentDocument[] = [];
  public bankAccountCode = '';

  private readonly rememberedValues: Record<string, any> = {};

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const remembered = this.app.ui.old();
    this.rememberedValues = this.asRecord(remembered);

    const catalog = this.state.resource<unknown>('catalogs.accounts', null);
    const catalogRecord = this.asRecord(catalog);
    this.accounts = this.asAccounts(catalogRecord['accounts']);
    if (!this.accounts.length) {
      this.accounts = this.asAccounts(this.store.activeOwnerAccounts ? this.store.activeOwnerAccounts() : []);
    }
    const catalogOwner = this.asRecord(catalogRecord['owner']);
    const activeOwner = this.asRecord(this.store.activeOwner ? this.store.activeOwner() : null);
    const owner = Object.keys(catalogOwner).length ? catalogOwner : activeOwner;
    this.ownerName = String(owner['name'] ?? 'N/A');

    this.bankAccountCode = String(this.old('bank_account_code', this.accounts.length ? String(this.accounts[0]['code'] ?? '') : ''));

    const pending = this.state.resource<unknown>('reports.paymentsPending', []);
    const source = Array.isArray(pending) ? pending
      : (typeof this.store.pendingBalanceDocuments === 'function' ? this.store.pendingBalanceDocuments() : []);
    const today = this.app.ui.today();
    const dateValue = String(this.old('date', today));
    this.documents = (Array.isArray(source) ? source : []).map((item) => {
      const doc = this.asRecord(item);
      const isSale = String(doc['type_vc']) === 'V';
      const balance = String(doc['calculated_balance'] ?? 0);
      return {
        id: this.text(doc['id']),
        isSale,
        badgeClass: isSale ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700',
        folio: this.text(doc['folio']),
        date: this.text(doc['date']),
        total: this.app.ui.number(doc['total'], 2),
        paid: this.app.ui.number(doc['calculated_paid'], 2),
        balance: this.app.ui.number(doc['calculated_balance'], 2),
        rawBalance: balance,
        dateValue,
        amount: String(this.old('amount', balance))
      };
    });
  }

  public override old(key: string, fallback: any = ''): any {
    const value = this.rememberedValues[key];
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  private asRecord(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
  }

  private asAccounts(value: unknown): Array<Record<string, any>> {
    return Array.isArray(value) ? value as Array<Record<string, any>> : [];
  }

  private text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }
}
