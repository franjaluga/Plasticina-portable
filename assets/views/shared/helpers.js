(function () {
  'use strict';

  const helpers = window.Plasticina.views.helpers;

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
      '" data-account-search autocomplete="off"' + required + '>' +
      '</div>' + label + '</div>';
  }

  let accountSearchSequence = 0;
  const accountSearchBindings = [];
  let accountOutsideListenerAttached = false;

  function defaultAccountResolver() {
    return typeof Store !== 'undefined' && Store.activeOwnerAccounts ? Store.activeOwnerAccounts() : [];
  }

  function closeOtherAccountSearches(current) {
    accountSearchBindings.forEach(function (binding) {
      if (binding !== current) binding.hide();
    });
  }

  function onAccountOutsidePointerDown(event) {
    const target = event && event.target;
    accountSearchBindings.slice().forEach(function (binding) {
      if (binding.input.isConnected === false) {
        const index = accountSearchBindings.indexOf(binding);
        if (index !== -1) accountSearchBindings.splice(index, 1);
        return;
      }
      if (!target || target === binding.input || target === binding.panel ||
          (typeof binding.panel.contains === 'function' && binding.panel.contains(target))) return;
      binding.hide();
    });
  }

  function ensureAccountOutsideListener() {
    if (accountOutsideListenerAttached || typeof document === 'undefined' || !document.addEventListener) return;
    document.addEventListener('pointerdown', onAccountOutsidePointerDown);
    accountOutsideListenerAttached = true;
  }

  function bindAccountSearch(input, accounts, options) {
    if (!input) return null;
    if (input.__plasticinaAccountSearch) return input.__plasticinaAccountSearch;

    const opts = options || {};
    const source = accountSource(accounts);
    const listId = 'account-suggestions-' + (++accountSearchSequence);
    const panel = document.createElement('div');
    panel.id = listId;
    panel.className = 'account-suggestions hidden';
    panel.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);
    input.parentElement.appendChild(panel);

    let matches = [];
    let active = -1;

    function hide() {
      panel.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      active = -1;
    }

    function show() {
      closeOtherAccountSearches(binding);
      panel.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
    }

    function markActive() {
      Array.prototype.forEach.call(panel.querySelectorAll('[role="option"]'), function (option, index) {
        const selected = index === active;
        option.classList.toggle('account-suggestion-active', selected);
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    }

    function select(index) {
      const account = matches[index];
      if (!account) return;
      input.value = String(account.code);
      input.setCustomValidity('');
      updateAccountLabel(input, accountName(account), 'valid');
      hide();
      if (typeof opts.onSelect === 'function') opts.onSelect(account, input);
    }

    function render() {
      matches = searchAccounts(source, input.value, opts.limit === undefined ? 8 : opts.limit);
      if (!matches.length) {
        panel.innerHTML = '<div class="account-suggestion-empty">Sin coincidencias</div>';
        show();
        return;
      }
      panel.innerHTML = matches.map(function (account, index) {
        return '<button type="button" role="option" aria-selected="false" data-index="' + index +
          '" class="account-suggestion" data-code="' + UI.h(account.code) + '">' +
          '<span class="font-mono font-semibold text-slate-800">' + UI.h(account.code) + '</span>' +
          '<span class="text-slate-400"> - </span>' +
          '<span class="text-slate-600">' + UI.h(account.name) + '</span>' +
          '</button>';
      }).join('');
      Array.prototype.forEach.call(panel.querySelectorAll('[data-index]'), function (option) {
        option.addEventListener('mousedown', function (event) {
          event.preventDefault();
          select(Number(option.getAttribute('data-index')));
        });
      });
      active = -1;
      show();
    }

    input.addEventListener('focus', render);
    input.addEventListener('click', render);
    input.addEventListener('input', function () {
      input.setCustomValidity('');
      const labelState = accountLabelState(source, input.value);
      updateAccountLabel(input, labelState.text, labelState.state);
      render();
      if (typeof opts.onInput === 'function') opts.onInput(input);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!matches.length) render();
        if (!matches.length) return;
        active = event.key === 'ArrowDown'
          ? Math.min(active + 1, matches.length - 1)
          : Math.max(active - 1, 0);
        markActive();
        return;
      }
      if (event.key === 'Enter' && active >= 0 && matches[active]) {
        event.preventDefault();
        select(active);
        return;
      }
      if (event.key === 'Escape') hide();
    });
    input.addEventListener('focusout', function (event) {
      if (event && event.relatedTarget && typeof panel.contains === 'function' && panel.contains(event.relatedTarget)) return;
      hide();
    });

    const binding = { input: input, panel: panel, render: render, hide: hide, select: select, show: show };
    input.__plasticinaAccountSearch = binding;
    accountSearchBindings.push(binding);
    ensureAccountOutsideListener();
    return binding;
  }

  function bindAccountSearchForm(form, accounts, options) {
    if (!form) return null;
    if (form.__plasticinaAccountSearchForm) return form.__plasticinaAccountSearchForm;

    const opts = options || {};
    const selector = opts.selector || '[data-account-search]';
    const source = accountSource(accounts);

    function fields() {
      return Array.prototype.slice.call(form.querySelectorAll(selector));
    }

    fields().forEach(function (input) { bindAccountSearch(input, source, opts); });

    form.addEventListener('submit', function (event) {
      let valid = true;
      fields().forEach(function (input) {
        const value = String(input.value || '').trim();
        if (!value) {
          input.setCustomValidity('');
          updateAccountLabel(input, 'Seleccione o escriba cuenta', 'empty');
          return;
        }
        const result = resolveAccount(source, value);
        if (result.account) {
          input.value = String(result.account.code);
          input.setCustomValidity('');
          updateAccountLabel(input, accountName(result.account), 'valid');
          if (typeof opts.onResolve === 'function') opts.onResolve(result.account, input);
          return;
        }
        valid = false;
        const message = result.ambiguous
          ? 'La cuenta "' + value + '" es ambigua; seleccione una coincidencia de la lista.'
          : 'No existe una cuenta contable que coincida con "' + value + '".';
        updateAccountLabel(input, result.ambiguous ? 'Cuenta ambigua' : 'Cuenta no encontrada', 'invalid');
        input.setCustomValidity(message);
        if (typeof UI !== 'undefined' && UI.notify) UI.notify(message, 'error');
      });
      if (!valid) event.preventDefault();
    });

    const binding = { form: form, fields: fields };
    form.__plasticinaAccountSearchForm = binding;
    return binding;
  }

  function bindAccountSearchFormsIn(container, resolver, options) {
    const root = container || (typeof document !== 'undefined' ? document : null);
    if (!root || typeof root.querySelectorAll !== 'function') return [];
    const bindings = [];
    Array.prototype.forEach.call(root.querySelectorAll('form[data-action]'), function (form) {
      if (!form.querySelector || !form.querySelector('[data-account-search]')) return;
      if (form.__plasticinaAccountSearchForm) return;
      const accounts = typeof resolver === 'function'
        ? resolver(form)
        : (resolver === undefined || resolver === null ? defaultAccountResolver(form) : resolver);
      const binding = bindAccountSearchForm(form, accounts, options || {});
      if (binding) bindings.push(binding);
    });
    return bindings;
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
    oldValue, pad, capitalize, num,
    normalizeAccountText, accountLabel, accountName, searchAccounts, resolveAccount,
    accountDisplayName, accountLabelState, updateAccountLabel,
    accountSearchField, bindAccountSearch, bindAccountSearchForm, bindAccountSearchFormsIn,
    accountOptions, format0, format0OrDash, queryYear, queryMonth,
    reportPeriodHelp, balancePeriodHelp, docTypeName, renderUpload
  });
})();
