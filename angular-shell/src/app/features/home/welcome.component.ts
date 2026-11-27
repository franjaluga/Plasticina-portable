import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { AppSelectComponent } from '../../shared/ui/app-select.component';
import { ViewBaseComponent } from '../../shared/view-base.component';

interface WelcomeOwner {
  id: number | string | null;
  name: string;
  rut: string;
}

interface WelcomeSummary {
  owner: WelcomeOwner | null;
  workingYear: number;
  pendingCount: number;
}

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  imports: [AppSelectComponent]
})
export class WelcomeComponent extends ViewBaseComponent implements OnDestroy {
  public owner: WelcomeOwner | null = null;
  public selectedYear = '';
  public pendingCount = 0;
  public yearOptions: SelectOption[] = [];
  public yearLocked = true;

  private readonly subscription = new Subscription();

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
    this.subscription.add(this.state.state$.subscribe(() => this.load()));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public toggleYearEdit(): void {
    this.yearLocked = !this.yearLocked;
  }

  public onYearChange(value: string | number | null): void {
    this.selectedYear = value === null || value === undefined ? '' : String(value);
  }

  private load(): void {
    const summary = this.state.resource<WelcomeSummary>('home.summary', this.fallbackSummary());
    this.owner = summary && summary.owner ? summary.owner : null;
    this.pendingCount = Number(summary && summary.pendingCount) || 0;

    const workingYear = Number(summary && summary.workingYear) || new Date().getFullYear();
    const range = this.workingYearRange();
    const clamped = Math.min(Math.max(workingYear, range.min), range.max);
    const options: SelectOption[] = [];
    for (let year = range.max; year >= range.min; year--) {
      options.push({ value: String(year), label: String(year) });
    }
    this.yearOptions = options;
    this.selectedYear = String(this.old('working_year', String(clamped)) || clamped);
  }

  private fallbackSummary(): WelcomeSummary {
    const owner = this.store.activeOwner ? this.store.activeOwner() : null;
    const documents = this.store.pendingDocuments ? this.store.pendingDocuments() : [];
    const year = this.store.workingYear ? this.store.workingYear() : new Date().getFullYear();
    return {
      owner: owner ? { id: owner.id, name: String(owner.name || ''), rut: String(owner.rut || '') } : null,
      workingYear: Number(year) || new Date().getFullYear(),
      pendingCount: Array.isArray(documents) ? documents.length : 0
    };
  }

  private workingYearRange(): { min: number; max: number } {
    const range = this.store.workingYearRange ? this.store.workingYearRange() : null;
    const max = range && Number.isFinite(Number(range.max))
      ? Number(range.max)
      : new Date().getFullYear() + 1;
    const min = range && Number.isFinite(Number(range.min)) ? Number(range.min) : max;
    return { min: Math.min(min, max), max };
  }
}
