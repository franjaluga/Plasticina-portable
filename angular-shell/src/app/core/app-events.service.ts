import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppEventsService {
  private installed = false;

  constructor(private readonly zone: NgZone) {}

  install(): void {
    if (this.installed) return;
    this.installed = true;
    document.addEventListener('change', (event) => {
      this.zone.run(() => this.onSelectAll(event));
    });
  }

  private onSelectAll(event: Event): void {
    const source = event.target instanceof HTMLInputElement ? event.target : null;
    if (!source || source.getAttribute('data-select-all') === null) return;
    const selector = source.getAttribute('data-select-all') || '.doc-checkbox';
    const root = source.form || document;
    root.querySelectorAll<HTMLInputElement>(selector).forEach((checkbox) => {
      checkbox.checked = source.checked;
    });
  }
}
