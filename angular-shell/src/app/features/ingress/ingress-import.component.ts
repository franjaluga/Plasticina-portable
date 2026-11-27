import { Component } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-ingress-import',
  standalone: true,
  templateUrl: './ingress-import.component.html',
  imports: [AppSelectComponent]
})
export class IngressImportComponent extends ViewBaseComponent {
  public readonly monthOptions: SelectOption[] = [];
  public readonly saleFormatOptions: SelectOption[] = [
    { value: 'factura', label: 'Ventas facturas' },
    { value: 'boleta', label: 'Ventas boletas' }
  ];
  public purchaseMonth: string;
  public purchaseYear: string;
  public salesMonth: string;
  public salesYear: string;
  public saleFormat: string;
  public yearMin: string | number;
  public yearMax: string | number;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    const query = this.state.context.query || {};
    const currentMonth = new Date().getMonth() + 1;
    const workingYear = this.store.workingYear ? this.store.workingYear() : new Date().getFullYear();
    const month = query['month_register'] === undefined || query['month_register'] === ''
      ? String(currentMonth)
      : String(query['month_register']);
    const year = query['year_register'] === undefined || query['year_register'] === ''
      ? String(workingYear)
      : String(query['year_register']);
    const range = this.store.workingYearRange ? this.store.workingYearRange() : { min: workingYear, max: workingYear };

    this.purchaseMonth = month;
    this.purchaseYear = year;
    this.salesMonth = month;
    this.salesYear = year;
    this.saleFormat = query['sale_format'] === 'boleta' ? 'boleta' : 'factura';
    this.yearMin = range.min;
    this.yearMax = range.max;

    for (let value = 1; value <= 12; value++) {
      this.monthOptions.push({
        value: String(value),
        label: String(value) + ' - ' + this.capitalize(this.app.ui.monthName(value))
      });
    }
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public onPurchaseMonthChange(value: string | number | null): void {
    this.purchaseMonth = value === null || value === undefined ? '' : String(value);
  }

  public onSalesMonthChange(value: string | number | null): void {
    this.salesMonth = value === null || value === undefined ? '' : String(value);
  }

  public onSaleFormatChange(value: string | number | null): void {
    this.saleFormat = value === null || value === undefined ? '' : String(value);
  }

  public onPurchaseYearChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input) this.purchaseYear = input.value;
  }

  public onSalesYearChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input) this.salesYear = input.value;
  }

  private capitalize(value: unknown): string {
    const text = String(value ?? '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
