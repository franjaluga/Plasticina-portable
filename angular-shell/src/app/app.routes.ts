import { Routes } from '@angular/router';
import { AccountingAnalyticsComponent } from './features/accounting/accounting-analytics.component';
import { AuditIndexComponent } from './features/accounting/audit-index.component';
import { EditJournalComponent } from './features/accounting/edit-journal.component';
import { EditManualJournalComponent } from './features/accounting/edit-manual-journal.component';
import { JournalDetailComponent } from './features/accounting/journal-detail.component';
import { LedgerResultsComponent } from './features/accounting/ledger-results.component';
import { ManualJournalCreateComponent } from './features/accounting/manual-journal-create.component';
import { ManualJournalCreatedComponent } from './features/accounting/manual-journal-created.component';
import { PaymentsIndexComponent } from './features/accounting/payments-index.component';
import { SystemJournalsComponent } from './features/accounting/system-journals.component';
import { DocumentBatchProcessedComponent } from './features/documents/document-batch-processed.component';
import { DocumentCreateComponent } from './features/documents/document-create.component';
import { DocumentDetailComponent } from './features/documents/document-detail.component';
import { DocumentPendingComponent } from './features/documents/document-pending.component';
import { DocumentQueryResultsComponent } from './features/documents/document-query-results.component';
import { TaxBalanceComponent } from './features/documents/tax-balance.component';
import { WelcomeComponent } from './features/home/welcome.component';
import { DocumentUploadComponent } from './features/ingress/document-upload.component';
import { IngressImportPurchasesImportedComponent } from './features/ingress/import-purchases-imported.component';
import { IngressImportPurchasesPreviewComponent } from './features/ingress/import-purchases-preview.component';
import { IngressImportPurchasesComponent } from './features/ingress/import-purchases.component';
import { IngressImportSalesImportedComponent } from './features/ingress/import-sales-imported.component';
import { IngressImportSalesPreviewComponent } from './features/ingress/import-sales-preview.component';
import { IngressImportSalesComponent } from './features/ingress/import-sales.component';
import { IngressImportComponent } from './features/ingress/ingress-import.component';
import { IngressManualComponent } from './features/ingress/ingress-manual.component';
import { TemplatesEditComponent } from './features/masters/templates-edit.component';
import { TemplatesIndexComponent } from './features/masters/templates-index.component';
import { OwnersAccountsComponent } from './features/owners/owners-accounts.component';
import { OwnersIndexComponent } from './features/owners/owners-index.component';
import { OwnersShowComponent } from './features/owners/owners-show.component';
import { AnalyticsHubComponent } from './features/reports/analytics-hub.component';
import { BalanceContextComponent } from './features/reports/balance-context.component';
import { LedgerContextComponent } from './features/reports/ledger-context.component';
import { SystemConfigComponent } from './features/system/system-config.component';
import { viewDataResolver } from './core/view-data.resolver';
import { ExportCommandComponent } from './shared/export-command.component';
import { NotFoundComponent } from './shared/not-found.component';
import { Type } from '@angular/core';

const VIEWS: Record<string, Type<unknown>> = {
  welcome: WelcomeComponent,
  ingressManual: IngressManualComponent,
  ingressImport: IngressImportComponent,
  documentUpload: DocumentUploadComponent,
  ingressImportPurchases: IngressImportPurchasesComponent,
  ingressImportPurchasesPreview: IngressImportPurchasesPreviewComponent,
  ingressImportPurchasesImported: IngressImportPurchasesImportedComponent,
  ingressImportSales: IngressImportSalesComponent,
  ingressImportSalesPreview: IngressImportSalesPreviewComponent,
  ingressImportSalesImported: IngressImportSalesImportedComponent,
  analyticsHub: AnalyticsHubComponent,
  balanceContext: BalanceContextComponent,
  ledgerContext: LedgerContextComponent,
  systemConfig: SystemConfigComponent,
  ownersIndex: OwnersIndexComponent,
  ownersShow: OwnersShowComponent,
  ownersAccounts: OwnersAccountsComponent,
  documentCreate: DocumentCreateComponent,
  documentPending: DocumentPendingComponent,
  documentBatchProcessed: DocumentBatchProcessedComponent,
  taxBalance: TaxBalanceComponent,
  documentQueryResults: DocumentQueryResultsComponent,
  accountingAnalytics: AccountingAnalyticsComponent,
  auditIndex: AuditIndexComponent,
  systemJournals: SystemJournalsComponent,
  journalDetail: JournalDetailComponent,
  editJournal: EditJournalComponent,
  manualJournalCreate: ManualJournalCreateComponent,
  manualJournalCreated: ManualJournalCreatedComponent,
  editManualJournal: EditManualJournalComponent,
  paymentsIndex: PaymentsIndexComponent,
  ledgerResults: LedgerResultsComponent,
  documentDetail: DocumentDetailComponent,
  templatesIndex: TemplatesIndexComponent,
  templatesEdit: TemplatesEditComponent
};

function view(path: string, name: string): Routes {
  return [{
    path,
    component: VIEWS[name],
    data: { view: name },
    resolve: { viewData: viewDataResolver }
  }];
}

export const routes: Routes = [
  { path: 'accounting/reports', redirectTo: 'reports/analytics', pathMatch: 'full' },
  { path: 'system/database/export', component: ExportCommandComponent },
  { path: 'accounting/system-journals/export-csv', component: ExportCommandComponent },
  { path: 'vc-documents/balance-tributario/export-csv', component: ExportCommandComponent },
  ...view('', 'welcome'),
  ...view('ingress/manual', 'ingressManual'),
  ...view('ingress/import', 'ingressImport'),
  ...view('ingress/import/generic', 'documentUpload'),
  ...view('ingress/import/compras', 'ingressImportPurchases'),
  ...view('ingress/import/compras/preview', 'ingressImportPurchasesPreview'),
  ...view('ingress/import/compras/importado', 'ingressImportPurchasesImported'),
  ...view('ingress/import/ventas', 'ingressImportSales'),
  ...view('ingress/import/ventas/preview', 'ingressImportSalesPreview'),
  ...view('ingress/import/ventas/importado', 'ingressImportSalesImported'),
  ...view('reports/analytics', 'analyticsHub'),
  ...view('reports/balance-context', 'balanceContext'),
  ...view('reports/ledger-context', 'ledgerContext'),
  ...view('system/config', 'systemConfig'),
  ...view('owners', 'ownersIndex'),
  ...view('owners/:owner', 'ownersShow'),
  ...view('owners/:owner/accounts', 'ownersAccounts'),
  ...view('vc-documents/create', 'documentCreate'),
  ...view('vc-documents/pendientes', 'documentPending'),
  ...view('vc-documents/contabilizados', 'documentBatchProcessed'),
  ...view('vc-documents/balance-tributario', 'taxBalance'),
  ...view('accounting/documents/query', 'documentQueryResults'),
  ...view('accounting/analytics', 'accountingAnalytics'),
  ...view('accounting/reports/audit', 'auditIndex'),
  ...view('accounting/audit', 'auditIndex'),
  ...view('accounting/system-journals', 'systemJournals'),
  ...view('accounting/journals/:id/detail', 'journalDetail'),
  ...view('accounting/journals/:id/edit', 'editJournal'),
  ...view('accounting/manual-journals/create', 'manualJournalCreate'),
  ...view('accounting/manual-journals/created', 'manualJournalCreated'),
  ...view('accounting/manual-journals/:id/edit', 'editManualJournal'),
  ...view('accounting/payments', 'paymentsIndex'),
  ...view('accounting/ledger', 'ledgerResults'),
  ...view('accounting/documents/:id', 'documentDetail'),
  ...view('masters/account-templates', 'templatesIndex'),
  ...view('masters/account-templates/:accountTemplate/edit', 'templatesEdit'),
  { path: '**', component: NotFoundComponent }
];
