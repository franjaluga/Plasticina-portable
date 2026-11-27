import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppEventsService } from './core/app-events.service';
import { PlasticinaService } from './core/plasticina.service';

interface HelpLink {
  href: string;
  label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  helpOpen = false;
  isHome = true;
  ready = false;
  error = '';

  helpLinks: Partial<Record<string, HelpLink>> = {};

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly app: PlasticinaService,
    private readonly events: AppEventsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.app.initialize();
      this.buildHelpLinks();
      this.events.install();
      this.ready = true;
      this.updateRoute(this.router.url);
      this.subscriptions.add(
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) this.updateRoute(event.urlAfterRedirects);
        })
      );
      await this.router.navigateByUrl(this.router.url || '/');
    } catch (error) {
      this.error = this.app.message(error);
    }
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(event?: MouseEvent): void {
    if (event && event.target !== event.currentTarget) return;
    this.helpOpen = false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.helpOpen = false;
  }

  private buildHelpLinks(): void {
    const owner = this.app.store.activeOwner ? this.app.store.activeOwner() : null;
    this.helpLinks = {
      accountPlan: this.link('owners.accounts.index', 'plan de cuentas', { owner: owner ? owner.id : 1 }),
      manual: this.link('ingress.manual', 'asiento manual'),
      imports: this.link('ingress.import', 'importadores'),
      purchasesStart: this.link('ingress.import.purchases', 'suben'),
      purchasesPreview: this.link('ingress.import.purchases.preview', 'revisan'),
      purchasesImported: this.link('ingress.import.purchases.imported', 'guardan'),
      pending: this.link('vc_documents.pending', 'centralizan'),
      payments: this.link('accounting.payments.index', 'tesorería'),
      balance: this.link('reports.balance_context', 'balance'),
      journals: this.link('accounting.system_journals', 'libro diario'),
      ledger: this.link('reports.ledger_context', 'libro mayor'),
      taxBalance: this.link('vc_documents.tax_balance', 'libro de compras y ventas'),
      templates: this.link('masters.account_templates.index', 'plantillas de cuentas'),
      config: this.link('system.config', 'configuración general'),
      owners: this.link('owners.index', 'empresas')
    };
  }

  private link(name: string, label: string, parameters?: unknown): HelpLink {
    const ui = this.app.ui;
    const href = ui && typeof ui.route === 'function'
      ? this.app.route(name, parameters)
      : '#/';
    return { href, label };
  }

  private updateRoute(url: string): void {
    this.isHome = url.split('?')[0].replace(/^#\//, '') === '/' || url === '/';
  }
}
