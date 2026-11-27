import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

const REQUIRED_HEADERS = ['Tipo Doc', 'RUT Proveedor', 'Razon Social', 'Folio', 'Fecha Docto', 'Monto Total'];

@Component({
  selector: 'app-import-purchases',
  standalone: true,
  templateUrl: './import-purchases.component.html'
})
export class IngressImportPurchasesComponent extends ViewBaseComponent {
  public readonly requiredColumns: string[];
  public readonly month: string | number;
  public readonly year: string | number;
  public readonly periodLabel: string;
  public fileNameLabel = 'Ningún archivo seleccionado';
  public buttonLabel = 'Validar y revisar →';

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const query = this.state.context.query || {};
    const headers = Array.isArray(this.store.PURCHASE_HEADERS) ? this.store.PURCHASE_HEADERS as string[] : [];
    const month = query['month_register'] === undefined || query['month_register'] === ''
      ? new Date().getMonth() + 1
      : query['month_register'];
    const year = query['year_register'] === undefined || query['year_register'] === ''
      ? (this.store.workingYear ? this.store.workingYear() : new Date().getFullYear())
      : query['year_register'];

    this.requiredColumns = headers.filter((header) => REQUIRED_HEADERS.indexOf(header) !== -1);
    this.month = month;
    this.year = year;
    this.periodLabel = String(month).padStart(2, '0') + '/' + String(year);
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input && input.files && input.files.length ? input.files[0] : null;
    this.fileNameLabel = file
      ? file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)'
      : 'Ningún archivo seleccionado';
    this.buttonLabel = file ? 'Validar ' + file.name + ' y revisar →' : 'Validar y revisar →';
  }
}

export { IngressImportPurchasesComponent as ImportPurchasesComponent };
