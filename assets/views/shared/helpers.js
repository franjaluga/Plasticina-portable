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

  Object.assign(helpers, { oldValue, pad, capitalize, num, accountOptions, format0, format0OrDash, queryYear, queryMonth, reportPeriodHelp, balancePeriodHelp, docTypeName, renderUpload });
})();
