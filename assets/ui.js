window.UI = (function () {
  const routes = {
    'welcome': '/',
    'period.update': '/period/update',
    'ingress.manual': '/ingress/manual',
    'ingress.import': '/ingress/import',
    'reports.analytics': '/reports/analytics',
    'reports.journal_context': '/reports/journal-context',
    'reports.balance_context': '/reports/balance-context',
    'reports.ledger_context': '/reports/ledger-context',
    'vc_documents.journal_book.form': '/vc-documents/libro-diario/rango',
    'system.config': '/system/config',
    'owners.index': '/owners',
    'owners.show': '/owners/{owner}',
    'owners.accounts.index': '/owners/{owner}/accounts',
    'vc_documents.create': '/vc-documents/create',
    'vc_documents.pending': '/vc-documents/pendientes',
    'vc_documents.journal_book': '/vc-documents/libro-diario',
    'vc_documents.journal_book.generate': '/vc-documents/libro-diario/generar',
    'vc_documents.export_csv': '/vc-documents/libro-diario/export-csv',
    'vc_documents.tax_balance': '/vc-documents/balance-tributario',
    'vc_documents.query': '/accounting/documents/query',
    'accounting.reports.index': '/accounting/reports',
    'accounting.analytics': '/accounting/analytics',
    'accounting.reports.audit': '/accounting/reports/audit',
    'accounting.audit.index': '/accounting/audit',
    'accounting.system_journals': '/accounting/system-journals',
    'accounting.journals.detail': '/accounting/journals/{id}/detail',
    'accounting.journals.edit': '/accounting/journals/{id}/edit',
    'accounting.manual_journals.create': '/accounting/manual-journals/create',
    'accounting.manual_journals.edit': '/accounting/manual-journals/{id}/edit',
    'accounting.payments.index': '/accounting/payments',
    'accounting.ledger': '/accounting/ledger',
    'accounting.documents.detail': '/accounting/documents/{id}',
    'masters.account_templates.index': '/masters/account-templates',
    'masters.account_templates.edit': '/masters/account-templates/{accountTemplate}/edit',
    'system.database.export': '/system/database/export'
  };

  function h(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') value = JSON.stringify(value);
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function json(value) {
    return JSON.stringify(value === undefined ? null : value).replace(/</g, '\\u003c');
  }

  function route(name, parameters) {
    let path = routes[name] || '/';
    const params = parameters === undefined || parameters === null
      ? {}
      : (typeof parameters === 'object' ? Object.assign({}, parameters) : { id: parameters });
    path = path.replace(/\{([^}]+)\}/g, function (_, key) {
      const value = params[key];
      delete params[key];
      if (value && typeof value === 'object' && 'id' in value) return encodeURIComponent(String(value.id));
      return value === undefined || value === null ? '' : encodeURIComponent(String(value));
    });
    const query = Object.keys(params)
      .filter(function (key) { return params[key] !== undefined && params[key] !== null && params[key] !== ''; })
      .map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(String(params[key])); })
      .join('&');
    return '#' + path + (query ? '?' + query : '');
  }

  function parseHash(hash) {
    const raw = String(hash || '').replace(/^#/, '') || '/';
    const parts = raw.split('?');
    const path = '/' + parts[0].replace(/^\/+|\/+$/g, '');
    const query = {};
    new URLSearchParams(parts[1] || '').forEach(function (value, key) { query[key] = value; });
    return { path: path === '/' ? '/' : path, query: query };
  }

  function number(value, decimals) {
    const digits = decimals === undefined ? 0 : decimals;
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(Number(value || 0));
  }

  function money(value) {
    return '$' + number(value, 0);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthName(month) {
    const names = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return names[Number(month) - 1] || '';
  }

  function flash(type, message) {
    const bag = JSON.parse(sessionStorage.getItem('plasticina_flash') || '[]');
    bag.push({ type: type, message: message });
    sessionStorage.setItem('plasticina_flash', JSON.stringify(bag));
  }

  function takeFlash() {
    let bag = [];
    try { bag = JSON.parse(sessionStorage.getItem('plasticina_flash') || '[]'); } catch (error) { bag = []; }
    sessionStorage.removeItem('plasticina_flash');
    if (!Array.isArray(bag) || bag.length === 0) return '';
    return bag.map(function (item) {
      const color = item.type === 'error' || item.type === 'danger'
        ? 'bg-red-50 border-red-500 text-red-700'
        : 'bg-emerald-50 border-emerald-500 text-emerald-700';
      return '<div class="mb-5 border-l-4 ' + color + ' p-4 text-xs font-semibold rounded-r-lg">' + h(item.message) + '</div>';
    }).join('');
  }

  function remember(values) {
    sessionStorage.setItem('plasticina_old', JSON.stringify(values || {}));
  }

  function old(key, fallback) {
    let values = {};
    try { values = JSON.parse(sessionStorage.getItem('plasticina_old') || '{}'); } catch (error) { values = {}; }
    sessionStorage.removeItem('plasticina_old');
    if (key === undefined || key === null) return values;
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : fallback;
  }

  function field(form, name) {
    const element = form.elements[name];
    if (!element) return '';
    if (element instanceof RadioNodeList) return element.value;
    return element.value;
  }

  function entriesFrom(form) {
    const result = [];
    const elements = form.elements;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const match = /^entries\[([^\]]+)\]\[(\w+)\]$/.exec(element.name);
      if (!match) continue;
      const key = match[1];
      let entry = result.find(function (item) { return item._key === key; });
      if (!entry) {
        entry = { _key: key };
        result.push(entry);
      }
      entry[match[2]] = element.value;
    }
    return result;
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
  }

  return {
    routes: routes,
    h: h,
    json: json,
    route: route,
    parseHash: parseHash,
    number: number,
    money: money,
    today: today,
    monthName: monthName,
    flash: flash,
    takeFlash: takeFlash,
    remember: remember,
    old: old,
    field: field,
    entriesFrom: entriesFrom,
    download: download
  };
})();
