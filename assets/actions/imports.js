(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, fail, integer, readForm, run } = helpers;

  window.Actions = window.Actions || {};

  function goTo(routeName, parameters) {
    const target = UI.route(routeName, parameters);
    if (window.location.hash === target) {
      if (window.App) window.App.render();
    } else {
      window.location.hash = target;
    }
  }

  function periodFrom(values) {
    const source = values || {};
    return {
      month_register: integer(source.month_register),
      year_register: integer(source.year_register)
    };
  }

  function periodError(period) {
    const status = Store.reportPeriodStatus(period.year_register, period.month_register);
    if (status.allowed) return null;
    return new Error(window.Plasticina.views.helpers.reportPeriodHelp(status).text);
  }

  function headersFrom(form) {
    const result = [];
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index];
      if (element.name === 'headers[]') result.push(element.value);
    }
    return result.length ? result : (Store.PURCHASE_HEADERS || []).slice();
  }

  function rowsFrom(form) {
    return helpers.grouped(form, 'rows')
      .sort(function (a, b) { return Number(a._key) - Number(b._key); })
      .map(function (item) {
        const row = { line: Number(item._key) + 2, cells: {}, derived: {} };
        Object.keys(item).forEach(function (key) {
          if (key === '_key') return;
          if (/^c\d+$/.test(key)) row.cells[key] = item[key];
          else row.derived[key] = item[key];
        });
        return row;
      });
  }

  function rememberPreview(fileName, headers, rows, period) {
    const chosen = periodFrom(period);
    UI.remember({
      kind: 'purchases',
      fileName: fileName || 'documentos.csv',
      headers: headers,
      rows: rows,
      month_register: chosen.month_register,
      year_register: chosen.year_register,
      type_vc: 'C'
    });
  }

  window.Actions['imports.purchases_start'] = function (form) {
    const values = readForm(form);
    const period = periodFrom(values);
    const error = periodError(period);
    if (error) {
      fail(error, values);
      return;
    }
    goTo('ingress.import.purchases', period);
  };

  window.Actions['imports.purchases_upload'] = function (form) {
    const values = readForm(form);
    const period = periodFrom(values);
    const periodProblem = periodError(period);
    const input = form.elements.csv_file;
    const file = input && input.files ? input.files[0] : null;
    if (periodProblem) {
      fail(periodProblem, values);
      return;
    }
    if (!file) {
      fail(new Error('Debe seleccionar un archivo CSV válido.'), values);
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = Store.parsePurchases(String(reader.result || ''));
        const payload = Object.assign({ headers: parsed.headers, rows: parsed.rows, type_vc: 'C' }, period);
        const validation = Store.validatePurchases(payload);
        rememberPreview(file.name || 'documentos.csv', payload.headers, payload.rows, period);
        UI.flash(validation.ok ? 'success' : 'error', validation.ok
          ? 'CSV leído correctamente. Revisa y confirma los documentos antes de guardarlos.'
          : 'Se detectaron ' + validation.errorCount + ' dato(s) faltante(s) o inválido(s). Corrígelos en la grilla antes de procesar.');
        goTo('ingress.import.purchases.preview');
      } catch (error) {
        fail(error, values);
      }
    };
    reader.onerror = function () { fail(new Error('No se pudo leer el archivo CSV.'), values); };
    reader.readAsText(file, 'UTF-8');
  };

  window.Actions['imports.purchases_confirm'] = function (form) {
    return run(form, async function (values) {
      const period = periodFrom(values);
      const periodProblem = periodError(period);
      if (periodProblem) throw periodProblem;
      const payload = Object.assign({ headers: headersFrom(form), rows: rowsFrom(form), type_vc: 'C' }, period);
      if (payload.rows.length === 0) throw new Error('No hay documentos para procesar.');
      const validation = Store.validatePurchases(payload);
      if (!validation.ok) {
        rememberPreview(values.file_name, payload.headers, payload.rows, period);
        UI.flash('error', 'Corrige ' + validation.errorCount + ' dato(s) marcado(s) antes de procesar.');
        goTo('ingress.import.purchases.preview');
        return undefined;
      }
      const previousYear = Store.workingYear();
      if (previousYear !== period.year_register) {
        await Store.setWorkingYear(period.year_register);
      }
      let processed;
      try {
        processed = await Store.importPurchases(payload);
      } catch (error) {
        if (Store.workingYear() !== previousYear) {
          await Store.setWorkingYear(previousYear);
        }
        throw error;
      }
      afterSuccess('¡CSV de compras importado! Se ingresaron ' + processed + ' documentos.', 'ingress.import.purchases.imported');
      return undefined;
    });
  };

  window.Actions['imports.purchases_cancel'] = function (source) {
    const dataset = source && source.dataset ? source.dataset : {};
    const period = dataset.monthRegister === undefined ? undefined : periodFrom(dataset);
    sessionStorage.removeItem('plasticina_old');
    goTo('ingress.import.purchases', period);
  };
})();
