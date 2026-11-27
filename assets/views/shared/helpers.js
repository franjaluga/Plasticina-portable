(function () {
  'use strict';

  const helpers = window.Plasticina.views.helpers;

  function dataset(ctx, name, fallback) {
    const data = ctx && ctx.data ? ctx.data : null;
    if (data && Object.prototype.hasOwnProperty.call(data, name)) return data[name];
    return typeof fallback === 'function' ? fallback() : fallback;
  }

  function oldValue(oldValues, key, fallback) {
    if (oldValues && Object.prototype.hasOwnProperty.call(oldValues, key) && oldValues[key] !== null && oldValues[key] !== undefined && oldValues[key] !== '') {
      return oldValues[key];
    }
    return fallback;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function capitalize(value) {
    const text = String(value || '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function num(value) {
    return Number(value || 0);
  }

  function normalizeAccountText(value) {
    const text = value === undefined || value === null ? '' : String(value);
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function accountLabel(account) {
    if (!account) return '';
    return String(account.code || '') + ' - ' + String(account.name || '');
  }

  function accountName(account) {
    return account ? String(account.name || '') : '';
  }

  function accountSource(accounts) {
    const seen = Object.create(null);
    return (Array.isArray(accounts) ? accounts : []).filter(function (account) {
      if (!account || account.code === undefined || account.code === null || seen[account.code]) return false;
      seen[account.code] = true;
      return true;
    });
  }

  function searchAccounts(accounts, term, limit) {
    const needle = normalizeAccountText(term);
    const max = limit === undefined ? 8 : Math.max(0, Number(limit) || 0);
    const source = accountSource(accounts);
    const matches = source.filter(function (account) {
      if (!needle) return true;
      return normalizeAccountText(account.code).indexOf(needle) !== -1 ||
        normalizeAccountText(account.name).indexOf(needle) !== -1;
    });
    return max ? matches.slice(0, max) : matches;
  }

  function resolveAccount(accounts, value) {
    const source = accountSource(accounts);
    const term = normalizeAccountText(value);
    if (!term) return { account: null, ambiguous: false, matches: [] };

    let account = source.find(function (item) { return normalizeAccountText(item.code) === term; });
    if (account) return { account: account, ambiguous: false, matches: [account] };

    const exactNames = source.filter(function (item) { return normalizeAccountText(item.name) === term; });
    if (exactNames.length === 1) return { account: exactNames[0], ambiguous: false, matches: exactNames };
    if (exactNames.length > 1) return { account: null, ambiguous: true, matches: exactNames };

    const matches = searchAccounts(source, term, 0);
    if (matches.length === 1) return { account: matches[0], ambiguous: false, matches: matches };
    return { account: null, ambiguous: matches.length > 1, matches: matches };
  }

  function accountDisplayName(accounts, value) {
    const result = resolveAccount(accounts, value);
    return result.account ? accountLabel(result.account) : '';
  }

  function accountLabelState(accounts, value) {
    const result = resolveAccount(accounts, value);
    if (result.account) return { text: accountName(result.account), state: 'valid' };
    if (!String(value === undefined || value === null ? '' : value).trim()) {
      return { text: 'Seleccione o escriba cuenta', state: 'empty' };
    }
    return { text: result.ambiguous ? 'Cuenta ambigua' : 'Cuenta no encontrada', state: 'invalid' };
  }

  function updateAccountLabel(input, text, state) {
    if (!input) return;
    const wrap = input.closest('.account-search-wrap') || input.parentElement;
    const label = wrap ? wrap.querySelector('.account-name-label') : null;
    if (!label) return;
    const value = text === undefined || text === null ? '' : String(text);
    label.textContent = value;
    label.setAttribute('title', value);
    label.classList.remove('text-gray-400', 'italic', 'text-slate-600', 'font-medium');
    if (state === 'valid') {
      label.classList.add('text-slate-600', 'font-medium');
    } else {
      label.classList.add('text-gray-400', 'italic');
    }
  }

  function accountSearchField(name, value, options) {
    const opts = options || {};
    const id = opts.id ? ' id="' + UI.h(opts.id) + '"' : '';
    const required = opts.required === false ? '' : ' required';
    const showLabel = opts.showLabel !== false;
    const labelState = opts.label === undefined
      ? accountLabelState(opts.accounts, value)
      : { text: String(opts.label), state: 'valid' };
    const picker = opts.picker === false ? '' : ' data-account-picker="' + UI.h(opts.picker || '') + '"';
    const source = opts.source === undefined ? '' : ' data-account-source="' + UI.h(opts.source) + '"';
    const ownerId = opts.ownerId === undefined || opts.ownerId === null || opts.ownerId === ''
      ? '' : ' data-owner-id="' + UI.h(opts.ownerId) + '"';
    const workingYear = opts.workingYear === undefined || opts.workingYear === null || opts.workingYear === ''
      ? '' : ' data-working-year="' + UI.h(opts.workingYear) + '"';
    const labelClass = labelState.state === 'valid'
      ? 'account-name-label truncate text-xs text-slate-600 font-medium'
      : 'account-name-label truncate text-xs text-gray-400 italic';
    const label = showLabel
      ? '<span class="' + UI.h(opts.labelClass || labelClass) +
        '" title="' + UI.h(labelState.text) + '">' + UI.h(labelState.text) + '</span>'
      : '';
    return '<div class="' + UI.h(opts.wrapperClass || 'account-search-wrap flex items-center gap-2') + '">' +
      '<div class="account-search-field relative min-w-0 flex-1">' +
      '<input type="text"' + id + ' name="' + UI.h(name) + '" value="' + UI.h(value || '') +
      '" placeholder="' + UI.h(opts.placeholder || 'Código o nombre') +
      '" class="' + UI.h(opts.inputClass || 'w-full text-xs border border-gray-300 rounded px-3 py-2 bg-white') +
      '" data-account-search' + picker + source + ownerId + workingYear + ' autocomplete="off"' + required + '>' +
      '</div>' + label + '</div>';
  }

  function defaultAccountResolver() {
    return typeof Store !== 'undefined' && Store.activeOwnerAccounts ? Store.activeOwnerAccounts() : [];
  }

  function picker() {
    return window.Plasticina.views.accountPicker || null;
  }

  function bindAccountSearch(input, accounts, options) {
    const controller = picker();
    return controller ? controller.bindInput(input, accounts, options) : null;
  }

  function bindAccountSearchForm(form, accounts, options) {
    const controller = picker();
    return controller ? controller.bindForm(form, accounts, options) : null;
  }

  function bindAccountSearchFormsIn(container, resolver, options) {
    const controller = picker();
    if (!controller) return [];
    return controller.mount(container, resolver, options);
  }

  function accountOptions(accounts, selectedCode) {
    return (accounts || []).map(function (acc) {
      return `<option value="${UI.h(acc.code)}"${String(selectedCode) === String(acc.code) ? ' selected' : ''}>${UI.h(acc.code)} - ${UI.h(acc.name)}</option>`;
    }).join('');
  }

  function format0(value) {
    return UI.h(UI.number(value, 0));
  }

  function format0OrDash(value) {
    return num(value) ? format0(value) : '-';
  }

  function taxBalanceFigures(balanceRows) {
    const figures = {
      sumSd: 0, sumSc: 0, sumBd: 0, sumBc: 0,
      sumAct: 0, sumPas: 0, sumPer: 0, sumGan: 0,
      resPerdida: 0, resGanancia: 0, resActivo: 0, resPasivo: 0
    };
    (balanceRows || []).forEach(function (row) {
      figures.sumSd += num(row.sum_debit);
      figures.sumSc += num(row.sum_credit);
      figures.sumBd += num(row.balance_debit);
      figures.sumBc += num(row.balance_credit);
      figures.sumAct += num(row.activo);
      figures.sumPas += num(row.pasivo);
      figures.sumPer += num(row.perdida);
      figures.sumGan += num(row.ganancia);
    });
    const diffResult = Math.abs(figures.sumPer - figures.sumGan);
    if (figures.sumGan > figures.sumPer) {
      figures.resPerdida = diffResult;
      figures.resPasivo = diffResult;
    } else if (figures.sumPer > figures.sumGan) {
      figures.resGanancia = diffResult;
      figures.resActivo = diffResult;
    }
    figures.totalInvActivo = figures.sumAct + figures.resActivo;
    figures.totalInvPasivo = figures.sumPas + figures.resPasivo;
    figures.totalResPerdida = figures.sumPer + figures.resPerdida;
    figures.totalResGanancia = figures.sumGan + figures.resGanancia;
    return figures;
  }

  function queryYear(query) {
    return query && query.year !== undefined && query.year !== '' ? query.year : Store.workingYear();
  }

  function queryMonth(query) {
    return query && query.month !== undefined && query.month !== '' ? Number(query.month) : Number(UI.today().slice(5, 7));
  }

  function reportPeriodHelp(status) {
    if (status.reason === 'before-start') {
      return {
        valid: false,
        text: 'La fecha no puede ser anterior a ' + pad(status.startMonth) + '/' + status.startYear +
          ', mes/año de inicio de actividades de esta empresa.',
        className: 'text-[11px] text-rose-600 mt-2'
      };
    }
    if (status.reason === 'invalid') {
      return {
        valid: false,
        text: 'Selecciona un mes y año válidos.',
        className: 'text-[11px] text-rose-600 mt-2'
      };
    }
    return { valid: true, text: '', className: 'text-[11px] text-slate-400 mt-2' };
  }

  function balancePeriodHelp(status) {
    if (status.reason === 'no-data') {
      return {
        valid: false,
        text: 'No hay contabilidad disponible para este negocio. No es posible generar el balance.',
        className: 'text-[11px] text-rose-600 mt-2'
      };
    }
    const help = reportPeriodHelp(status);
    if (!help.valid) {
      return {
        valid: false,
        text: help.text + ' No es posible generar el balance.',
        className: 'text-[11px] text-rose-600 mt-2'
      };
    }
    const lastDay = new Date(Number(status.year), Number(status.month), 0).getDate();
    return {
      valid: true,
      text: 'Se procesa desde 01/01/' + status.year + ' hasta el ' + pad(lastDay) + '/' + pad(status.month) + '/' + status.year + '.',
      className: 'text-[11px] text-slate-400 mt-2'
    };
  }

  function docTypeName(doc) {
    return doc && doc.documentType ? (doc.documentType.name || 'Doc') : 'Doc';
  }

  function renderUpload(ctx) {
    const owner = Store.activeOwner();
    return `
    <div class="max-w-xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div style="margin-bottom: 20px; text-align: left; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 5px;">Importar documentos V/C</h2>
            <p style="font-size: 14px; color: #64748b; margin: 0;">Carga masiva de registros de ventas y compras a través de un archivo CSV.</p>
        </div>

        <form data-action="documents.csv" enctype="multipart/form-data">
            <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">

            <div style="margin-bottom: 20px; text-align: left;">
                <label for="csv_file" style="display: block; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 8px;">
                    Archivo CSV o TXT
                </label>

                <input type="file"
                       name="csv_file"
                       id="csv_file"
                       accept=".csv,.txt"
                       required
                       style="display: block; width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 14px; cursor: pointer;">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <a href="${UI.h(UI.route('welcome'))}" style="font-size: 14px; font-weight: 500; background: #f1f5f9; color: #334155; padding: 10px 16px; border-radius: 8px; text-decoration: none;">
                    &larr; Volver
                </a>
                <button type="submit" style="background: #4f46e5; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                    Subir y procesar
                </button>
            </div>
        </form>
    </div>
    `;
  }

  Object.assign(helpers, {
    dataset, oldValue, pad, capitalize, num,
    normalizeAccountText, accountLabel, accountName, accountSource, searchAccounts, resolveAccount,
    accountDisplayName, accountLabelState, updateAccountLabel, defaultAccountResolver,
    accountSearchField, bindAccountSearch, bindAccountSearchForm, bindAccountSearchFormsIn,
    accountOptions, format0, format0OrDash, taxBalanceFigures, queryYear, queryMonth,
    reportPeriodHelp, balancePeriodHelp, docTypeName, renderUpload
  });
})();
