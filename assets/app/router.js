(function () {
  'use strict';

  const config = window.Plasticina.app.config;
  const app = document.getElementById('app');

  function routePattern(route) {
    const keys = [];
    const pattern = route.path.replace(/\{([^}]+)\}/g, function (_, key) {
      keys.push(key);
      return '([^/]+)';
    });
    return { regex: new RegExp('^' + pattern + '$'), keys: keys };
  }

  function matchRoute(path) {
    for (let index = 0; index < config.routes.length; index++) {
      const route = config.routes[index];
      const pattern = routePattern(route);
      const match = pattern.regex.exec(path);
      if (!match) continue;
      const params = {};
      pattern.keys.forEach(function (key, offset) {
        params[key] = decodeURIComponent(match[offset + 1]);
      });
      return { view: route.view, params: params };
    }
    return null;
  }

  function runScripts(container) {
    const scripts = Array.prototype.slice.call(container.querySelectorAll('script'));
    scripts.forEach(function (oldScript) {
      const script = document.createElement('script');
      Array.prototype.forEach.call(oldScript.attributes, function (attribute) {
        script.setAttribute(attribute.name, attribute.value);
      });
      script.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(script, oldScript);
    });
  }

  function renderNotFound(flash) {
    return '<div class="w-full">' + flash +
      '<div class="max-w-xl mx-auto p-10 text-center text-sm text-slate-600">404 - Vista no encontrada.</div></div>';
  }

  function renderError(flash, error) {
    const message = UI.h(error.message || String(error));
    return '<div class="w-full">' + flash +
      '<div class="max-w-2xl mx-auto p-8"><div class="bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-700">' +
      message + '</div></div></div>';
  }

  function reportPeriodValues(kind, values) {
    const source = values || {};
    const today = UI.today();
    if (kind === 'month-year') {
      return {
        year: source.year === undefined || source.year === '' ? Store.workingYear() : source.year,
        month: source.month === undefined || source.month === '' ? today.slice(5, 7) : source.month
      };
    }
    if (kind === 'date-from' || kind === 'date-from-or-year') {
      const match = /^(\d{4})-(\d{1,2})/.exec(String(source.date_from || ''));
      if (match) return { year: match[1], month: match[2] };
      if (kind === 'date-from-or-year') {
        return { year: source.year === undefined || source.year === '' ? Store.workingYear() : source.year, month: 12 };
      }
      return { year: today.slice(0, 4), month: today.slice(5, 7) };
    }
    return { year: source.year === undefined || source.year === '' ? Store.workingYear() : source.year, month: 12 };
  }

  function validateReportPeriod(kind, values) {
    const period = reportPeriodValues(kind, values);
    return Store.reportPeriodStatus(period.year, period.month);
  }

  function renderPeriodBlocked(flash, status, context) {
    const help = window.Plasticina.views.helpers.reportPeriodHelp(status);
    return '<div class="w-full">' + flash +
      '<div class="max-w-xl mx-auto p-8">' +
      '<div class="bg-rose-50 border-l-4 border-rose-500 p-4 text-xs text-rose-700">' +
      'No es posible generar el reporte. ' + UI.h(help.text) + '</div>' +
      '<a href="' + UI.h('#' + context) + '" class="inline-block mt-4 text-xs font-semibold text-indigo-600">' +
      '&larr; Volver al reporte</a></div></div>';
  }

  function homeButton() {
    return '<a href="' + UI.h(UI.route('welcome')) + '" aria-label="Ir al inicio" title="Inicio" ' +
      'style="position:fixed;top:72px;right:16px;z-index:9998;display:inline-flex;align-items:center;' +
      'justify-content:center;width:40px;height:40px;background:#4f46e5;color:#fff;' +
      'border-radius:9999px;box-shadow:0 4px 6px -1px rgba(0,0,0,.2);">' +
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
      'd="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>' +
      '</svg></a>';
  }

  function helpButton() {
    return '<button type="button" aria-label="Ayuda" title="Mini guía del sistema" ' +
      'onclick="window.Plasticina.app.router.toggleHelp()" ' +
      'style="position:fixed;bottom:16px;right:20px;z-index:9998;display:inline-flex;align-items:center;' +
      'justify-content:center;width:40px;height:40px;padding:0;border:0;cursor:pointer;' +
      'background:#4f46e5;color:#fff;border-radius:9999px;box-shadow:0 4px 6px -1px rgba(0,0,0,.2);">' +
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
      'd="M12 22a10 10 0 100-20 10 10 0 000 20zM9.6 9a2.5 2.5 0 114.1 1.9c-.9.7-1.7 1.2-1.7 2.4M12 17h.01"></path>' +
      '</svg></button>';
  }

  function helpLink(name, label, parameters) {
    return '<a href="' + UI.h(UI.route(name, parameters)) + '" onclick="window.Plasticina.app.router.closeHelp()" ' +
      'style="color:#4f46e5;font-weight:600;text-decoration:none;">' + label + '</a>';
  }

  function helpSection(number, title, body) {
    return '<section style="display:flex;gap:12px;">' +
      '<span style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;' +
      'border-radius:9999px;background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:700;">' + number + '</span>' +
      '<div><h3 style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0f172a;">' + title + '</h3>' +
      '<p style="margin:0;">' + body + '</p></div></section>';
  }

  function helpGuide() {
    const owner = Store.activeOwner ? Store.activeOwner() : null;
    const accountPlan = helpLink('owners.accounts.index', 'plan de cuentas', { owner: owner ? owner.id : 1 });
    return '<div id="plasticina-help-guide" role="dialog" aria-modal="true" aria-label="Mini guía del sistema" ' +
      'aria-hidden="true" style="display:none;position:fixed;inset:0;z-index:10005;align-items:center;' +
      'justify-content:center;background:rgba(15,23,42,.55);padding:16px;" ' +
      'onclick="window.Plasticina.app.router.closeHelp(event)">' +
      '<div style="max-width:680px;width:100%;max-height:85vh;overflow:auto;background:#fff;border-radius:16px;' +
      'box-shadow:0 20px 40px rgba(15,23,42,.25);border:1px solid #e2e8f0;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;' +
      'border-bottom:1px solid #e2e8f0;">' +
      '<div><h2 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">Mini guía del sistema</h2>' +
      '<p style="margin:4px 0 0;font-size:11px;color:#64748b;">Cómo funciona Plasticina</p></div>' +
      '<button type="button" onclick="window.Plasticina.app.router.closeHelp()" aria-label="Cerrar ayuda" ' +
      'title="Cerrar" style="border:0;background:transparent;color:#64748b;font-size:22px;line-height:1;' +
      'cursor:pointer;">&times;</button></div>' +
      '<div style="padding:20px 24px;display:grid;gap:16px;font-size:12px;line-height:1.6;color:#475569;">' +
      helpSection('1', 'Asientos manuales o importadores',
        'Puedes registrar asientos manualmente en ' + helpLink('ingress.manual', 'asiento manual') +
        ' o cargar la información desde archivos usando los ' + helpLink('ingress.import', 'importadores') + '.') +
      helpSection('2', 'Documentos: de la carga al cobro o pago',
        'Los documentos vía importador primero se ' + helpLink('ingress.import.purchases', 'suben') +
        ', se ' + helpLink('ingress.import.purchases.preview', 'revisan') + ' y se ' +
        helpLink('ingress.import.purchases.imported', 'guardan') +
        ' en el registro de compras y ventas. Luego se ' + helpLink('vc_documents.pending', 'centralizan') +
        ', donde al asignar una cuenta contable se genera su propio asiento contable. Finalmente se pueden cobrar o pagar desde ' +
        helpLink('accounting.payments.index', 'tesorería') + '.') +
      helpSection('3', 'Reportes disponibles',
        'Puedes consultar el ' + helpLink('reports.balance_context', 'balance') + ', el ' +
        helpLink('accounting.system_journals', 'libro diario') + ', el ' +
        helpLink('reports.ledger_context', 'libro mayor') + ' y el ' +
        helpLink('vc_documents.tax_balance', 'libro de compras y ventas') + ', entre otros.') +
      helpSection('4', 'Configuración y empresas',
        'También puedes ajustar el ' + accountPlan + ', usar ' +
        helpLink('masters.account_templates.index', 'plantillas de cuentas') + ', cambiar la ' +
        helpLink('system.config', 'configuración general') + ' y crear más ' +
        helpLink('owners.index', 'empresas') + '.') +
      '</div></div></div>';
  }

  function toggleHelp() {
    const guide = document.getElementById('plasticina-help-guide');
    if (!guide) return;
    const open = guide.style.display === 'none' || !guide.style.display;
    guide.style.display = open ? 'flex' : 'none';
    guide.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function closeHelp(event) {
    if (event && event.target !== event.currentTarget) return;
    const guide = document.getElementById('plasticina-help-guide');
    if (!guide) return;
    guide.style.display = 'none';
    guide.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('keydown', function (event) {
    if (event && event.key === 'Escape') closeHelp();
  });

  function withFloatingButtons(html, viewName) {
    return helpButton() + helpGuide() + (viewName === 'welcome' ? '' : homeButton()) + html;
  }

  function renderView(viewName, match, flash, query) {
    document.body.className = config.bodyClasses[viewName] || config.bodyClasses.welcome;
    if (!match || typeof window.Views[viewName] !== 'function') {
      app.innerHTML = withFloatingButtons(renderNotFound(flash), viewName);
      return;
    }
    try {
      app.innerHTML = withFloatingButtons('<div class="w-full">' + flash +
        window.Views[viewName]({ params: match.params, query: query }) + '</div>', viewName);
      runScripts(app);
      if (window.Plasticina.views.helpers && window.Plasticina.views.helpers.bindAccountSearchFormsIn) {
        window.Plasticina.views.helpers.bindAccountSearchFormsIn(app);
      }
    } catch (error) {
      app.innerHTML = withFloatingButtons(renderError(flash, error), viewName);
    }
  }

  function render() {
    const parsed = UI.parseHash(window.location.hash);
    const rule = config.reportPeriodRoutes[parsed.path] || null;
    if (rule) {
      const periodStatus = validateReportPeriod(rule.kind, parsed.query);
      if (!periodStatus.allowed) {
        app.innerHTML = withFloatingButtons(renderPeriodBlocked(UI.takeFlash(), periodStatus, rule.context), null);
        sessionStorage.removeItem('plasticina_old');
        window.scrollTo(0, 0);
        return;
      }
    }
    if (parsed.path === '/system/database/export') {
      if (window.Actions['system.sqlite-export']) window.Actions['system.sqlite-export']();
      return;
    }
    if (parsed.path === '/accounting/system-journals/export-csv') {
      window.Plasticina.app.exportSystemJournalsCsv(parsed.query);
      return;
    }
    if (parsed.path === '/accounting/reports') {
      navigate(UI.route('reports.analytics'));
      return;
    }

    const match = matchRoute(parsed.path);
    const flash = UI.takeFlash();
    const viewName = match ? match.view : 'welcome';
    renderView(viewName, match, flash, parsed.query);
    sessionStorage.removeItem('plasticina_old');
    window.scrollTo(0, 0);
  }

  function navigate(path) {
    window.location.hash = path;
  }

  window.Plasticina.app.router = {
    matchRoute: matchRoute,
    validateReportPeriod: validateReportPeriod,
    runScripts: runScripts,
    toggleHelp: toggleHelp,
    closeHelp: closeHelp,
    render: render,
    navigate: navigate
  };
})();
