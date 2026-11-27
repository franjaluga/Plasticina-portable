import { Component, HostListener } from '@angular/core';
import { ActionService } from '../../core/action.service';
import { PlasticinaService } from '../../core/plasticina.service';
import { ViewStateService } from '../../core/view-state.service';
import { ViewBaseComponent } from '../../shared/view-base.component';

@Component({
  standalone: true,
  selector: 'app-system-config',
  templateUrl: './system-config.component.html'
})
export class SystemConfigComponent extends ViewBaseComponent {
  public resetOpen = false;
  public resetStep = 1;

  constructor(app: PlasticinaService, state: ViewStateService, actions: ActionService) {
    super(app, state, actions);
  }

  public override route(name: string, parameters?: unknown): string {
    return super.route(name, parameters);
  }

  public override submit(name: string, event: Event): void {
    super.submit(name, event);
  }

  public override linkAction(name: string, event: Event): void {
    super.linkAction(name, event);
  }

  public openResetModal(): void {
    this.resetStep = 1;
    this.resetOpen = true;
  }

  public closeResetModal(): void {
    this.resetStep = 1;
    this.resetOpen = false;
  }

  public showResetStep(step: number): void {
    this.resetStep = step;
  }

  public onModalBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeResetModal();
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.resetOpen) {
      this.closeResetModal();
    }
  }
}
