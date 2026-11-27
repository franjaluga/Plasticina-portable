import { Component } from '@angular/core';
import { PlasticinaService } from '../core/plasticina.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: '<div class="max-w-xl mx-auto p-10 text-center text-sm text-slate-600">404 - Vista no encontrada.</div>'
})
export class NotFoundComponent {
  constructor(private readonly app: PlasticinaService) {
    this.app.applyBodyClass('welcome');
  }
}
