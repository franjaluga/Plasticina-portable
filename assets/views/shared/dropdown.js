(function () {
  'use strict';

  const views = window.Plasticina.views;
  const bindings = [];
  let sequence = 0;
  let outsideAttached = false;

  function normalizeOptions(options) {
    return (Array.isArray(options) ? options : []).map(function (item) {
      if (item === null || item === undefined) return { value: '', label: '' };
      if (typeof item !== 'object') return { value: String(item), label: String(item) };
      return {
        value: item.value === undefined || item.value === null ? '' : String(item.value),
        label: item.label === undefined || item.label === null ? '' : String(item.label)
      };
    });
  }

  function render(config) {
    const opts = config || {};
    const name = String(opts.name || '');
    const id = opts.id ? ' id="' + UI.h(opts.id) + '"' : '';
    const list = normalizeOptions(opts.options);
    const value = opts.value === undefined || opts.value === null ? '' : String(opts.value);
    const required = opts.required === false ? '' : ' required';
    const disabled = opts.disabled === true;
    const disabledAttr = disabled ? ' disabled' : '';
    const menuId = 'ui-select-menu-' + (++sequence);
    const labelClass = opts.labelClass || 'ui-select-label truncate';
    const triggerClass = opts.className || 'w-full text-xs border-slate-300 rounded-lg shadow-sm p-2 bg-white border';
    const wrapperClass = opts.wrapperClass || 'ui-select relative';
    const emptyLabel = opts.emptyLabel === undefined ? '' : String(opts.emptyLabel);
    const placeholder = opts.placeholder === undefined ? (emptyLabel || 'Seleccione una opción') : String(opts.placeholder);

    let selectedLabel = placeholder;
    const optionsHtml = list.map(function (item) {
      const selected = item.value === value;
      if (selected) selectedLabel = item.label;
      return '<li type="button" class="ui-select-option" role="option" aria-selected="' + (selected ? 'true' : 'false') +
        '" data-value="' + UI.h(item.value) + '" tabindex="-1">' + UI.h(item.label) + '</li>';
    }).join('');

    return '<div class="' + UI.h(wrapperClass + (disabled ? ' is-disabled' : '')) + '"' + id +
      ' data-ui-select data-name="' + UI.h(name) + '" data-value="' + UI.h(value) + '"' +
      (opts.required === false ? '' : ' data-required="true"') + (disabled ? ' data-disabled="true"' : '') + '>' +
      '<input type="text" class="ui-select-value" name="' + UI.h(name) + '" value="' + UI.h(value) + '"' +
      required + disabledAttr + ' tabindex="-1" aria-hidden="true">' +
      '<button type="button" class="ui-select-trigger ' + UI.h(triggerClass) + '" role="combobox"' +
      ' aria-haspopup="listbox" aria-expanded="false" aria-controls="' + menuId + '"' + disabledAttr + '>' +
      '<span class="' + UI.h(labelClass) + '">' + UI.h(selectedLabel) + '</span>' +
      '<svg class="ui-select-arrow" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />' +
      '</svg></button>' +
      '<ul class="ui-select-menu hidden" role="listbox" id="' + menuId + '">' + optionsHtml + '</ul>' +
      '</div>';
  }

  function prune() {
    bindings.slice().forEach(function (binding) {
      if (binding.disposed || binding.root.isConnected === false) {
        binding.disposed = true;
        const index = bindings.indexOf(binding);
        if (index !== -1) bindings.splice(index, 1);
      }
    });
  }

  function closeOthers(current) {
    bindings.forEach(function (binding) {
      if (binding !== current && binding.open) hide(binding);
    });
  }

  function onOutsidePointerDown(event) {
    prune();
    const target = event && event.target;
    bindings.forEach(function (binding) {
      if (!binding.open || !target) return;
      if (target === binding.root || typeof binding.root.contains === 'function' && binding.root.contains(target)) return;
      hide(binding);
    });
  }

  function ensureOutsideListener() {
    if (outsideAttached || typeof document === 'undefined' || !document.addEventListener) return;
    document.addEventListener('pointerdown', onOutsidePointerDown);
    outsideAttached = true;
  }

  function setActive(binding, index) {
    const options = binding.menu.querySelectorAll('[role="option"]');
    binding.active = index;
    Array.prototype.forEach.call(options, function (option, i) {
      const active = i === index;
      option.classList.toggle('ui-select-option-active', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const current = options[index];
    if (current && typeof current.scrollIntoView === 'function') {
      current.scrollIntoView({ block: 'nearest' });
    }
  }

  function hide(binding) {
    if (!binding.open) return;
    binding.menu.classList.add('hidden');
    binding.trigger.setAttribute('aria-expanded', 'false');
    binding.open = false;
    binding.active = -1;
  }

  function show(binding) {
    if (binding.disabled) return;
    closeOthers(binding);
    binding.menu.classList.remove('hidden');
    binding.trigger.setAttribute('aria-expanded', 'true');
    binding.open = true;
    const current = binding.options.findIndex(function (item) { return item.value === binding.value; });
    setActive(binding, current >= 0 ? current : -1);
  }

  function dispatch(binding, type) {
    const event = document.createEvent('Event');
    event.initEvent(type, true, true);
    binding.root.dispatchEvent(event);
    const inputEvent = document.createEvent('Event');
    inputEvent.initEvent(type, true, true);
    binding.input.dispatchEvent(inputEvent);
  }

  function setValue(binding, value) {
    const next = value === undefined || value === null ? '' : String(value);
    binding.value = next;
    binding.input.value = next;
    binding.root.setAttribute('data-value', next);
    binding.input.setCustomValidity('');
    let label = binding.placeholder;
    binding.options.forEach(function (item) {
      if (item.value === next) label = item.label;
    });
    binding.label.textContent = label;
    binding.label.setAttribute('title', label);
    binding.options.forEach(function (item, index) {
      const selected = item.value === next;
      const option = binding.menu.querySelectorAll('[role="option"]')[index];
      if (option) option.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    if (binding.required && !next) {
      binding.input.setCustomValidity('Seleccione una opción válida.');
    }
  }

  function select(binding, index) {
    const option = binding.options[index];
    if (!option) return;
    setValue(binding, option.value);
    hide(binding);
    dispatch(binding, 'change');
  }

  function setDisabled(binding, disabled) {
    binding.disabled = !!disabled;
    if (binding.disabled) {
      binding.root.classList.add('is-disabled');
      binding.root.setAttribute('data-disabled', 'true');
      binding.trigger.setAttribute('disabled', 'disabled');
      binding.input.setAttribute('disabled', 'disabled');
      hide(binding);
    } else {
      binding.root.classList.remove('is-disabled');
      binding.root.removeAttribute('data-disabled');
      binding.trigger.removeAttribute('disabled');
      binding.input.removeAttribute('disabled');
    }
  }

  function bind(root) {
    if (!root || typeof root.getAttribute !== 'function' || root.__plasticinaSelect) return root.__plasticinaSelect;
    const trigger = root.querySelector('.ui-select-trigger');
    const menu = root.querySelector('.ui-select-menu');
    const input = root.querySelector('.ui-select-value');
    const label = root.querySelector('.ui-select-label');
    if (!trigger || !menu || !input || !label) return null;

    const options = Array.prototype.map.call(menu.querySelectorAll('[role="option"]'), function (item) {
      return {
        value: item.getAttribute('data-value') || '',
        label: item.textContent || ''
      };
    });
    const binding = {
      root: root,
      trigger: trigger,
      menu: menu,
      input: input,
      label: label,
      name: root.getAttribute('data-name') || input.name || '',
      value: input.value || '',
      placeholder: label.textContent || 'Seleccione una opción',
      required: root.getAttribute('data-required') === 'true',
      disabled: root.getAttribute('data-disabled') === 'true',
      options: options,
      open: false,
      active: -1,
      disposed: false
    };

    setValue(binding, binding.value);
    setDisabled(binding, binding.disabled);

    Object.defineProperty(root, 'value', {
      get: function () { return binding.value; },
      set: function (value) {
        setValue(binding, value);
        dispatch(binding, 'change');
      },
      configurable: true
    });
    root.getValue = function () { return binding.value; };
    root.setValue = function (value) { setValue(binding, value); dispatch(binding, 'change'); };
    root.setDisabled = function (value) { setDisabled(binding, value); };
    root.isDisabled = function () { return binding.disabled; };
    root.openMenu = function () { show(binding); };
    root.closeMenu = function () { hide(binding); };

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      if (binding.disabled) return;
      if (binding.open) hide(binding); else show(binding);
      trigger.focus();
    });

    menu.addEventListener('mousedown', function (event) {
      const option = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-value]') : null;
      if (!option) return;
      event.preventDefault();
      const index = Array.prototype.indexOf.call(menu.querySelectorAll('[role="option"]'), option);
      select(binding, index);
      trigger.focus();
    });

    menu.addEventListener('mouseover', function (event) {
      const option = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('[data-value]') : null;
      if (!option || binding.disabled) return;
      const index = Array.prototype.indexOf.call(menu.querySelectorAll('[role="option"]'), option);
      if (index >= 0) setActive(binding, index);
    });

    trigger.addEventListener('keydown', function (event) {
      if (binding.disabled) return;
      const keys = ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape', 'Home', 'End'];
      if (keys.indexOf(event.key) === -1) return;
      event.preventDefault();
      if (event.key === 'Escape') {
        hide(binding);
        return;
      }
      if (!binding.open) {
        show(binding);
        return;
      }
      const last = binding.options.length - 1;
      if (event.key === 'ArrowDown') setActive(binding, Math.min(binding.active + 1, last));
      if (event.key === 'ArrowUp') setActive(binding, Math.max(binding.active - 1, 0));
      if (event.key === 'Home') setActive(binding, 0);
      if (event.key === 'End') setActive(binding, last);
      if (event.key === 'Enter' || event.key === ' ') {
        if (binding.active >= 0) select(binding, binding.active); else hide(binding);
      }
    });

    trigger.addEventListener('focusout', function (event) {
      if (event && event.relatedTarget && typeof menu.contains === 'function' && menu.contains(event.relatedTarget)) return;
      hide(binding);
    });

    input.addEventListener('change', function () {
      setValue(binding, input.value);
    });

    root.__plasticinaSelect = binding;
    bindings.push(binding);
    ensureOutsideListener();
    return binding;
  }

  function mount(container) {
    const root = container || (typeof document !== 'undefined' ? document : null);
    if (!root || typeof root.querySelectorAll !== 'function') return [];
    prune();
    const created = [];
    Array.prototype.forEach.call(root.querySelectorAll('[data-ui-select]'), function (element) {
      const binding = bind(element);
      if (binding) created.push(binding);
    });
    return created;
  }

  function find(element) {
    if (!element) return null;
    return element.__plasticinaSelect || (typeof element.closest === 'function'
      ? element.closest('[data-ui-select]') && element.closest('[data-ui-select]').__plasticinaSelect
      : null) || null;
  }

  views.dropdown = {
    render: render,
    mount: mount,
    bind: bind,
    prune: prune,
    setValue: function (element, value) {
      const binding = find(element);
      if (binding) setValue(binding, value);
    },
    getValue: function (element) {
      const binding = find(element);
      return binding ? binding.value : '';
    },
    setDisabled: function (element, disabled) {
      const binding = find(element);
      if (binding) setDisabled(binding, disabled);
    },
    bindings: function () { return bindings.slice(); }
  };
})();
