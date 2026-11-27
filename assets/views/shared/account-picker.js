(function () {
  'use strict';

  const views = window.Plasticina.views;
  const bindings = [];
  let sequence = 0;
  let outsideAttached = false;

  function helpers() {
    return views.helpers;
  }

  function accountList(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.accounts)) return value.accounts;
    return [];
  }

  function fallbackAccounts(input) {
    const api = helpers();
    if (api && typeof api.defaultAccountResolver === 'function') return api.defaultAccountResolver(input);
    return typeof Store !== 'undefined' && Store.activeOwnerAccounts ? Store.activeOwnerAccounts() : [];
  }

  function contextOf(input) {
    const get = input && typeof input.getAttribute === 'function' ? function (name) { return input.getAttribute(name); } : function () { return null; };
    const ownerValue = get('data-owner-id');
    const yearValue = get('data-working-year');
    const activeOwner = typeof Store !== 'undefined' && Store.activeOwner ? Store.activeOwner() : null;
    return {
      ownerId: ownerValue === null || ownerValue === '' ? (activeOwner ? activeOwner.id : null) : ownerValue,
      workingYear: yearValue ? Number(yearValue) : (typeof Store !== 'undefined' && Store.workingYear ? Store.workingYear() : new Date().getFullYear()),
      params: {},
      query: {},
      include: []
    };
  }

  function datasetAccounts(input) {
    if (!window.Data || typeof window.Data.resolve !== 'function') return null;
    if (typeof input.getAttribute === 'function' && input.getAttribute('data-account-source') === 'none') return null;
    const source = typeof input.getAttribute === 'function'
      ? (input.getAttribute('data-account-source') || 'catalogs.accounts')
      : 'catalogs.accounts';
    return Promise.resolve(window.Data.resolve(source, contextOf(input))).then(function (result) {
      return accountList(result && result.data ? result.data : result);
    }).catch(function () { return fallbackAccounts(input); });
  }

  function closeOthers(current) {
    bindings.forEach(function (binding) {
      if (binding !== current && binding.panel) binding.hide();
    });
  }

  function prune() {
    bindings.slice().forEach(function (binding) {
      if (binding.disposed || binding.input.isConnected === false) {
        binding.disposed = true;
        if (binding.timer) clearTimeout(binding.timer);
        const index = bindings.indexOf(binding);
        if (index !== -1) bindings.splice(index, 1);
      }
    });
  }

  function onOutsidePointerDown(event) {
    prune();
    const target = event && event.target;
    bindings.forEach(function (binding) {
      if (!binding.panel) return;
      if (!target || target === binding.input || target === binding.panel ||
          (typeof binding.panel.contains === 'function' && binding.panel.contains(target))) return;
      binding.hide();
    });
  }

  function ensureOutsideListener() {
    if (outsideAttached || typeof document === 'undefined' || !document.addEventListener) return;
    document.addEventListener('pointerdown', onOutsidePointerDown);
    outsideAttached = true;
  }

  function hide(binding) {
    if (binding.panel) binding.panel.classList.add('hidden');
    binding.input.setAttribute('aria-expanded', 'false');
    binding.active = -1;
  }

  function show(binding) {
    closeOthers(binding);
    if (!binding.panel) return;
    binding.panel.classList.remove('hidden');
    binding.input.setAttribute('aria-expanded', 'true');
  }

  function markActive(binding) {
    if (!binding.panel) return;
    const options = binding.panel.querySelectorAll('[role="option"]');
    Array.prototype.forEach.call(options, function (option, index) {
      const selected = index === binding.active;
      option.classList.toggle('account-suggestion-active', selected);
      option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  }

  function syncLabel(binding) {
    const api = helpers();
    const state = api.accountLabelState(binding.accounts, binding.input.value);
    api.updateAccountLabel(binding.input, state.text, state.state);
    return state;
  }

  function render(binding) {
    if (binding.disposed) return;
    if (binding.codeOnly) {
      syncLabel(binding);
      return;
    }
    const api = helpers();
    const limit = binding.options.limit === undefined ? 8 : Math.max(1, Number(binding.options.limit) || 8);
    binding.matches = api.searchAccounts(binding.accounts, binding.input.value, limit);
    binding.active = -1;
    if (!binding.matches.length) {
      binding.panel.innerHTML = '<div class="account-suggestion-empty">Sin coincidencias</div>';
    } else {
      binding.panel.innerHTML = binding.matches.map(function (account, index) {
        return '<button type="button" role="option" aria-selected="false" data-index="' + index +
          '" class="account-suggestion" data-code="' + UI.h(account.code) + '">' +
          '<span class="font-mono font-semibold text-slate-800">' + UI.h(account.code) + '</span>' +
          '<span class="text-slate-400"> - </span>' +
          '<span class="text-slate-600">' + UI.h(account.name) + '</span>' +
          '</button>';
      }).join('');
    }
    show(binding);
  }

  function scheduleRender(binding) {
    if (binding.timer) clearTimeout(binding.timer);
    binding.timer = setTimeout(function () {
      binding.timer = null;
      render(binding);
    }, 60);
  }

  function select(binding, index) {
    const account = binding.matches[index];
    if (!account) return;
    const api = helpers();
    binding.input.value = String(account.code);
    binding.input.setCustomValidity('');
    api.updateAccountLabel(binding.input, api.accountName(account), 'valid');
    hide(binding);
    if (typeof binding.options.onSelect === 'function') binding.options.onSelect(account, binding.input);
  }

  function normalize(binding) {
    const api = helpers();
    const value = String(binding.input.value || '').trim();
    if (!value) {
      binding.input.setCustomValidity('');
      api.updateAccountLabel(binding.input, 'Seleccione o escriba cuenta', 'empty');
      hide(binding);
      return { valid: false, empty: true };
    }
    const result = api.resolveAccount(binding.accounts, value);
    if (result.account) {
      binding.input.value = String(result.account.code);
      binding.input.setCustomValidity('');
      api.updateAccountLabel(binding.input, api.accountName(result.account), 'valid');
      hide(binding);
      return { valid: true, account: result.account };
    }
    const message = result.ambiguous
      ? 'La cuenta "' + value + '" es ambigua; seleccione una coincidencia de la lista.'
      : 'No existe una cuenta contable que coincida con "' + value + '".';
    binding.input.setCustomValidity(message);
    api.updateAccountLabel(binding.input, result.ambiguous ? 'Cuenta ambigua' : 'Cuenta no encontrada', 'invalid');
    render(binding);
    if (window.UI && window.UI.notify) window.UI.notify(message, 'error');
    return { valid: false, ambiguous: result.ambiguous, matches: result.matches };
  }

  function bindInput(input, resolver, options) {
    if (!input || typeof input.setAttribute !== 'function' || !input.parentElement) return null;
    if (input.__plasticinaAccountPicker) return input.__plasticinaAccountPicker;

    const opts = options || {};
    const mode = typeof input.getAttribute === 'function' ? (input.getAttribute('data-account-picker') || '') : '';
    const codeOnly = mode === 'code';
    const panel = codeOnly ? null : document.createElement('div');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', codeOnly ? 'none' : 'list');
    input.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.id = 'account-suggestions-' + (++sequence);
      panel.className = 'account-suggestions hidden';
      panel.setAttribute('role', 'listbox');
      input.setAttribute('aria-controls', panel.id);
      input.parentElement.appendChild(panel);
    }

    const binding = {
      input: input,
      panel: panel,
      codeOnly: codeOnly,
      options: opts,
      accounts: [],
      matches: [],
      active: -1,
      timer: null,
      disposed: false,
      hide: function () { hide(binding); },
      show: function () { render(binding); },
      select: function (index) { select(binding, index); },
      normalize: function () { return normalize(binding); }
    };

    const supplied = typeof resolver === 'function' ? resolver(input) : resolver;
    const initial = accountList(supplied);
    if (initial.length) {
      binding.accounts = initial;
    } else {
      binding.accounts = fallbackAccounts(input);
      const live = datasetAccounts(input);
      if (live && typeof live.then === 'function') {
        live.then(function (accounts) {
          if (!binding.disposed) {
            binding.accounts = accountList(accounts);
            syncLabel(binding);
          }
        });
      }
    }

    if (panel) {
      panel.addEventListener('mousedown', function (event) {
        const option = event.target && typeof event.target.closest === 'function'
          ? event.target.closest('[data-index]')
          : null;
        if (!option) return;
        event.preventDefault();
        select(binding, Number(option.getAttribute('data-index')));
      });
    }

    input.addEventListener('input', function () {
      input.setCustomValidity('');
      syncLabel(binding);
      if (!codeOnly) scheduleRender(binding);
      if (typeof opts.onInput === 'function') opts.onInput(input);
    });
    if (!codeOnly) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!binding.matches.length || binding.panel.classList.contains('hidden')) render(binding);
          if (!binding.matches.length) return;
          binding.active = event.key === 'ArrowDown'
            ? Math.min(binding.active + 1, binding.matches.length - 1)
            : Math.max(binding.active - 1, 0);
          markActive(binding);
          return;
        }
        if (event.key === 'Enter' && binding.active >= 0 && binding.matches[binding.active]) {
          event.preventDefault();
          select(binding, binding.active);
          return;
        }
        if (event.key === 'Enter') {
          const result = helpers().resolveAccount(binding.accounts, input.value);
          if (result.account) {
            event.preventDefault();
            select(binding, binding.matches.indexOf(result.account));
            if (binding.input.value !== String(result.account.code)) {
              binding.input.value = String(result.account.code);
              helpers().updateAccountLabel(binding.input, helpers().accountName(result.account), 'valid');
              hide(binding);
            }
          }
          return;
        }
        if (event.key === 'Escape') hide(binding);
      });
      input.addEventListener('focusout', function (event) {
        if (event && event.relatedTarget && typeof panel.contains === 'function' && panel.contains(event.relatedTarget)) return;
        hide(binding);
      });
    }

    input.addEventListener('focusout', function (event) {
      if (event && event.relatedTarget && typeof panel.contains === 'function' && panel.contains(event.relatedTarget)) return;
      hide(binding);
    });

    input.__plasticinaAccountPicker = binding;
    input.__plasticinaAccountSearch = binding;
    bindings.push(binding);
    ensureOutsideListener();
    return binding;
  }

  function bindForm(form, resolver, options) {
    if (!form || typeof form.querySelectorAll !== 'function') return null;
    if (form.__plasticinaAccountPickerForm) return form.__plasticinaAccountPickerForm;

    const opts = options || {};
    mount(form, resolver, opts);

    function fields() {
      return Array.prototype.slice.call(form.querySelectorAll('[data-account-picker], [data-account-search]'));
    }

    form.addEventListener('submit', function (event) {
      let valid = true;
      fields().forEach(function (input) {
        const binding = input.__plasticinaAccountPicker;
        if (!binding) return;
        const result = binding.normalize();
        if (result.valid || result.empty) {
          if (result.valid && typeof opts.onResolve === 'function') opts.onResolve(result.account, input);
          return;
        }
        valid = false;
      });
      if (!valid) event.preventDefault();
    });

    const binding = { form: form, fields: fields };
    form.__plasticinaAccountPickerForm = binding;
    form.__plasticinaAccountSearchForm = binding;
    return binding;
  }

  function mount(root, resolver, options) {
    const container = root || (typeof document !== 'undefined' ? document : null);
    if (!container || typeof container.querySelectorAll !== 'function') return [];
    prune();
    const created = [];
    const inputs = container.querySelectorAll('[data-account-picker], [data-account-search]');
    Array.prototype.forEach.call(inputs, function (input) {
      if (input.__plasticinaAccountPicker) return;
      const binding = bindInput(input, resolver, options);
      if (binding) created.push(binding);
    });
    return created;
  }

  function bindAll(root, resolver, options) {
    const container = root || (typeof document !== 'undefined' ? document : null);
    if (!container || typeof container.querySelectorAll !== 'function') return [];
    prune();
    const result = [];
    Array.prototype.forEach.call(container.querySelectorAll('form[data-action]'), function (form) {
      if (!form.querySelector || !form.querySelector('[data-account-picker], [data-account-search]')) return;
      const binding = bindForm(form, resolver, options);
      if (binding) result.push(binding);
    });
    mount(container, resolver, options);
    return result;
  }

  views.accountPicker = {
    mount: bindAll,
    bindInput: bindInput,
    bindForm: bindForm,
    prune: prune,
    bindings: function () { return bindings.slice(); },
    resolveValue: function (accounts, value) { return helpers().resolveAccount(accounts, value); },
    search: function (accounts, term, limit) { return helpers().searchAccounts(accounts, term, limit || 8); }
  };
})();
