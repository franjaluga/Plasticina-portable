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

  function renderView(viewName, match, flash, query) {
    document.body.className = config.bodyClasses[viewName] || config.bodyClasses.welcome;
    if (!match || typeof window.Views[viewName] !== 'function') {
      app.innerHTML = renderNotFound(flash);
      return;
    }
    try {
      app.innerHTML = '<div class="w-full">' + flash +
        window.Views[viewName]({ params: match.params, query: query }) + '</div>';
      runScripts(app);
    } catch (error) {
      app.innerHTML = renderError(flash, error);
    }
  }

  function render() {
    const parsed = UI.parseHash(window.location.hash);
    const rule = config.reportPeriodRoutes[parsed.path] || null;
    if (rule) {
      const periodStatus = validateReportPeriod(rule.kind, parsed.query);
      if (!periodStatus.allowed) {
        app.innerHTML = renderPeriodBlocked(UI.takeFlash(), periodStatus, rule.context);
        sessionStorage.removeItem('plasticina_old');
        window.scrollTo(0, 0);
        return;
      }
    }
    if (parsed.path === '/system/database/export') {
      if (window.Actions['system.sqlite-export']) window.Actions['system.sqlite-export']();
      return;
    }
    if (parsed.path === '/vc-documents/libro-diario/export-csv') {
      window.Plasticina.app.exportJournalCsv(parsed.query);
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
    render: render,
    navigate: navigate
  };
})();
