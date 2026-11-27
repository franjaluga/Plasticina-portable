import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionService } from '../core/action.service';
import { CsvExportService } from '../core/csv-export.service';
import { PlasticinaService } from '../core/plasticina.service';

@Component({
  selector: 'app-export-command',
  standalone: true,
  template: '<div class="max-w-xl mx-auto p-10 text-center text-sm text-slate-600">Preparando descarga…</div>'
})
export class ExportCommandComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly app: PlasticinaService,
    private readonly actions: ActionService,
    private readonly csv: CsvExportService
  ) {}

  ngOnInit(): void {
    const path = '/' + (this.route.snapshot.routeConfig?.path || '').replace(/^\/+|\/+$/g, '');
    const query = this.normalize(this.route.snapshot.queryParams);
    const status = this.app.reportPeriodStatus(path, query);
    if (!status.allowed) {
      this.app.flash('error', this.app.periodHelp(status));
      this.app.navigate(this.app.reportPeriodContext(path) || '/');
      return;
    }
    try {
      if (path === '/system/database/export') {
        this.actions.execute('system.sqlite-export');
      } else if (path === '/accounting/system-journals/export-csv') {
        this.csv.exportSystemJournalsCsv(query);
      } else if (path === '/vc-documents/balance-tributario/export-csv') {
        this.csv.exportTaxBalanceCsv(query);
      }
    } catch (error) {
      this.app.flash('error', this.app.message(error));
    }
    this.app.navigate(this.app.reportPeriodContext(path) || '/');
  }

  private normalize(source: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(source || {}).forEach((key) => {
      if (source[key] !== undefined && source[key] !== null) result[key] = String(source[key]);
    });
    return result;
  }
}
