window.Views = window.Views || {};

(function () {
  'use strict';

  window.Views.welcome = function (ctx) {
    const owner = Store.activeOwner();
    const workingYear = Store.workingYear();
    const currentYear = Number(UI.today().slice(0, 4));
    const pendingCount = Store.pendingDocuments().length;
    const years = [];
    for (let year = currentYear; year >= 2020; year--) {
      years.push(year);
    }
    const ownerLabel = owner
      ? UI.h(owner.name) + ' <span class="text-slate-500 font-normal">(' + UI.h(owner.rut) + ')</span>'
      : '<span class="text-amber-600 font-medium">Ningún owner seleccionado</span>';
    const pendingAlert = pendingCount > 0
      ? `
        <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900">
            <div class="text-left text-sm flex items-center space-x-3">
                <div class="p-2 bg-amber-500 text-white rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                    <span class="font-bold block">¡Atención!</span>
                    Tienes <span class="font-extrabold">${UI.h(pendingCount)}</span> documento(s) sin contabilizar en este periodo.
                </div>
            </div>
            <div>
                <a href="${UI.h(UI.route('vc_documents.pending'))}" class="text-xs font-semibold bg-amber-600 text-white px-3.5 py-2 rounded-lg hover:bg-amber-700 transition shadow-sm whitespace-nowrap">
                    Contabilizar
                </a>
            </div>
        </div>`
      : '';

    return `
    <div class="max-w-6xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="sm:col-span-2 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div class="text-left flex items-center space-x-3">
                    <div class="p-2 bg-indigo-600 text-white rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <div>
                        <span class="text-xs font-semibold uppercase tracking-wider text-indigo-600 block">Owner Activo</span>
                        <span class="text-sm font-bold text-slate-800">
                            ${ownerLabel}
                        </span>
                    </div>
                </div>
                <div>
                    <a href="${UI.h(UI.route('owners.index'))}" class="text-xs font-medium bg-white text-indigo-600 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition shadow-sm">
                        Cambiar
                    </a>
                </div>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Año de Trabajo</span>
                    <button type="button" id="editYearBtn" class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition">
                        Cambiar ejercicio contable
                    </button>
                </div>

                <form data-action="period.update" class="flex items-center space-x-2">
                    <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">
                    <select name="working_year" id="workingYearSelect" disabled class="w-full text-sm font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-not-allowed shadow-sm transition">
                        ${years.map(function (year) {
                          return `<option value="${UI.h(year)}"${Number(workingYear) === year ? ' selected' : ''}>${UI.h(year)}</option>`;
                        }).join('')}
                    </select>
                    <button type="submit" id="saveYearBtn" class="hidden text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition whitespace-nowrap">
                        Guardar
                    </button>
                </form>
            </div>
        </div>

        ${pendingAlert}

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Sistema Contable</h1>
            <p class="text-sm text-slate-500 mt-1">Selecciona una opción para gestionar tu contabilidad</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base mb-1">1. Ingreso Manual</h2>
                    <p class="text-xs text-slate-500 leading-relaxed mb-4">Registro individual de documentos V/C y creación de asientos contables.</p>
                </div>

                <div class="space-y-2">
                    <a href="${UI.h(UI.route('ingress.manual'))}" class="w-full text-xs font-semibold bg-indigo-50 text-indigo-700 p-2.5 rounded-lg hover:bg-indigo-600 hover:text-white transition flex items-center justify-between">
                        <span>Menú Ingreso Manual</span> &rarr;
                    </a>
                    <a href="${UI.h(UI.route('accounting.manual_journals.create'))}" class="w-full text-xs font-semibold bg-slate-900 text-white p-2.5 rounded-lg hover:bg-slate-800 transition flex items-center justify-between">
                        <span>+ Nuevo Asiento Directo</span> &rarr;
                    </a>
                </div>
            </div>

            <a href="${UI.h(UI.route('ingress.import'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-green-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-green-600 transition text-base mb-1">2. Importador</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Carga masiva de documentos mediante archivos CSV.</p>
                </div>
                <span class="text-xs font-semibold text-green-600 mt-6 flex items-center">
                    Cargar &rarr;
                </span>
            </a>

            <a href="${UI.h(UI.route('reports.analytics'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-purple-600 transition text-base mb-1">3. Reportes y Análisis</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Balances, auditoría V/C, cobros y pagos y asientos del sistema.</p>
                </div>
                <span class="text-xs font-semibold text-purple-600 mt-6 flex items-center">
                    Ver módulos &rarr;
                </span>
            </a>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
            <p>Sistema Contable v1.0</p>

            <div class="flex items-center space-x-4">
                <a href="${UI.h(UI.route('system.config'))}" class="inline-flex items-center space-x-1 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition">
                    <span>⚙️ Configuración General</span>
                </a>
            </div>
        </div>
    </div>

    <script>
    (function () {
      var config = ${UI.json({ workingYear: workingYear, currentYear: currentYear })};
      var selectElement = document.getElementById('workingYearSelect');
      var editBtn = document.getElementById('editYearBtn');
      var saveBtn = document.getElementById('saveYearBtn');
      if (selectElement) { selectElement.value = String(config.workingYear); }
      if (!selectElement || !editBtn || !saveBtn) { return; }
      editBtn.addEventListener('click', function () {
        if (selectElement.hasAttribute('disabled')) {
          selectElement.removeAttribute('disabled');
          selectElement.classList.remove('bg-slate-100', 'cursor-not-allowed');
          selectElement.classList.add('bg-white', 'cursor-pointer', 'border-indigo-500');
          editBtn.textContent = 'Cancelar';
          editBtn.classList.remove('text-indigo-600', 'bg-indigo-50');
          editBtn.classList.add('text-rose-600', 'bg-rose-50');
          saveBtn.classList.remove('hidden');
        } else {
          selectElement.setAttribute('disabled', 'disabled');
          selectElement.classList.add('bg-slate-100', 'cursor-not-allowed');
          selectElement.classList.remove('bg-white', 'cursor-pointer', 'border-indigo-500');
          editBtn.textContent = 'Cambiar ejercicio contable';
          editBtn.classList.add('text-indigo-600', 'bg-indigo-50');
          editBtn.classList.remove('text-rose-600', 'bg-rose-50');
          saveBtn.classList.add('hidden');
        }
      });
    })();
    </script>
    `;
  };

  window.Views.ingressManual = function (ctx) {
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('welcome'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver al inicio
            </a>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Ingreso Manual</h1>
            <p class="text-sm text-slate-500 mt-1">Selecciona una opción de registro</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="${UI.h(UI.route('vc_documents.create'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base mb-1">Registro V/C</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Ingresa facturas de compra o venta una a una con validación de cuentas.</p>
                </div>
                <span class="text-xs font-semibold text-indigo-600 mt-6 flex items-center">
                    Ingresar &rarr;
                </span>
            </a>

            <a href="${UI.h(UI.route('accounting.manual_journals.create'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-amber-600 transition text-base mb-1">Asiento Manual</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Crea asientos de partida doble independientes de documentos comerciales.</p>
                </div>
                <span class="text-xs font-semibold text-amber-600 mt-6 flex items-center">
                    Crear &rarr;
                </span>
            </a>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
            <p>Sistema Contable v1.0</p>
        </div>
    </div>
    `;
  };

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

  window.Views.ingressImport = function (ctx) {
    return `${renderUpload(ctx)}`;
  };

  window.Views.documentUpload = function (ctx) {
    return `${renderUpload(ctx)}`;
  };

  window.Views.analyticsHub = function (ctx) {
    return `
    <div class="max-w-6xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('welcome'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver al inicio
            </a>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Reportes y Análisis</h1>
            <p class="text-sm text-slate-500 mt-1">Selecciona un módulo o contexto de gestión</p>
        </div>

        <div class="mb-8">
            <div class="flex items-center space-x-3 mb-4 border-b border-slate-200 pb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">Contexto: Contabilidad</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <a href="${UI.h(UI.route('reports.journal_context'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <h2 class="font-bold text-slate-800 group-hover:text-emerald-600 transition text-base mb-1">Libro Diario</h2>
                        <p class="text-xs text-slate-500 leading-relaxed">Gestión de asientos del sistema, libro diario V/C y registros históricos.</p>
                    </div>
                    <span class="text-xs font-semibold text-emerald-600 mt-6 flex items-center">
                        Acceder &rarr;
                    </span>
                </a>

                <a href="${UI.h(UI.route('reports.balance_context'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base mb-1">Balance</h2>
                        <p class="text-xs text-slate-500 leading-relaxed">Balance tributario de 8 columnas.</p>
                    </div>
                    <span class="text-xs font-semibold text-indigo-600 mt-6 flex items-center">
                        Acceder &rarr;
                    </span>
                </a>

                <a href="${UI.h(UI.route('reports.ledger_context'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        </div>
                        <h2 class="font-bold text-slate-800 group-hover:text-amber-600 transition text-base mb-1">Libro Mayor</h2>
                        <p class="text-xs text-slate-500 leading-relaxed">Consulta detallada de movimientos, cargos y abonos por cuenta contable.</p>
                    </div>
                    <span class="text-xs font-semibold text-amber-600 mt-6 flex items-center">
                        Acceder &rarr;
                    </span>
                </a>

                <a href="${UI.h(UI.route('accounting.analytics'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4"></path></svg>
                        </div>
                        <h2 class="font-bold text-slate-800 group-hover:text-blue-600 transition text-base mb-1">Analíticos (V/C)</h2>
                        <p class="text-xs text-slate-500 leading-relaxed">Consulta específica de compras o ventas por tipo, mes y año.</p>
                    </div>
                    <span class="text-xs font-semibold text-blue-600 mt-6 flex items-center">
                        Consultar &rarr;
                    </span>
                </a>

                <a href="${UI.h(UI.route('accounting.reports.audit'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-sky-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4"></path></svg>
                        </div>
                        <h2 class="font-bold text-slate-800 group-hover:text-sky-600 transition text-base mb-1">Auditoría V/C</h2>
                        <p class="text-xs text-slate-500 leading-relaxed">Auditoría de registros y gestión de eliminación de documentos o asientos.</p>
                    </div>
                    <span class="text-xs font-semibold text-sky-600 mt-6 flex items-center">
                        Auditar &rarr;
                    </span>
                </a>
            </div>
        </div>

        <div>
            <div class="flex items-center space-x-3 mb-4 border-b border-slate-200 pb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">Contexto: Finanzas</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <a href="${UI.h(UI.route('accounting.payments.index'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <h2 class="font-bold text-slate-800 group-hover:text-purple-600 transition text-base mb-1">Cobros y Pagos</h2>
                        <p class="text-xs text-slate-500 leading-relaxed">Gestión de saldos pendientes y pagos a proveedores o cobros a clientes.</p>
                    </div>
                    <span class="text-xs font-semibold text-purple-600 mt-6 flex items-center">
                        Gestionar &rarr;
                    </span>
                </a>
            </div>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
            <p>Sistema Contable v1.0</p>
        </div>
    </div>
    `;
  };

  window.Views.journalContext = function (ctx) {
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver
            </a>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Contexto: Libro Diario</h1>
            <p class="text-sm text-slate-500 mt-1">Opciones de asientos y registros contables</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="${UI.h(UI.route('vc_documents.journal_book.form'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-emerald-600 transition text-base mb-1">Libro Diario</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Historial y exportación de asientos derivados de documentos por rango de fechas.</p>
                </div>
                <span class="text-xs font-semibold text-emerald-600 mt-6 flex items-center">
                    Consultar &rarr;
                </span>
            </a>

            <a href="${UI.h(UI.route('accounting.system_journals'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-emerald-600 transition text-base mb-1">Asientos del Sistema</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Visualización general, filtros y detalle de asientos.</p>
                </div>
                <span class="text-xs font-semibold text-emerald-600 mt-6 flex items-center">
                    Ver asientos &rarr;
                </span>
            </a>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
            <p>Sistema Contable v1.0</p>
        </div>
    </div>
    `;
  };

  window.Views.balanceContext = function (ctx) {
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver
            </a>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Contexto: Balance</h1>
            <p class="text-sm text-slate-500 mt-1">Estados financieros y balance tributario</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-xl mx-auto">
            <a href="${UI.h(UI.route('vc_documents.tax_balance'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base mb-1">Balance Tributario (8 Columnas)</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Genera el resumen de sumas, saldos, inventario y resultados.</p>
                </div>
                <span class="text-xs font-semibold text-indigo-600 mt-6 flex items-center">
                    Generar &rarr;
                </span>
            </a>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
            <p>Sistema Contable v1.0</p>
        </div>
    </div>
    `;
  };

  window.Views.ledgerContext = function (ctx) {
    const owner = Store.activeOwner();
    const accounts = owner ? Store.accounts(owner.id) : Store.activeOwnerAccounts();
    const query = ctx.query || {};
    const accountCode = query.account_code === undefined ? '' : query.account_code;
    const month = query.month === undefined || query.month === '' ? Number(UI.today().slice(5, 7)) : Number(query.month);
    const year = query.year === undefined || query.year === '' ? Store.workingYear() : query.year;
    const monthOptions = [];
    for (let value = 1; value <= 12; value++) {
      monthOptions.push(`<option value="${UI.h(value)}"${value === month ? ' selected' : ''}>${UI.h(value)}</option>`);
    }

    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">&larr; Volver</a>
        </div>
        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800">Contexto: Libro Mayor</h1>
            <p class="text-sm text-slate-500 mt-1">Consulta de movimientos por cuenta contable</p>
        </div>

        <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <form data-action="accounting.ledger" class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">
                <div>
                    <label for="account_code" class="block text-xs font-semibold text-slate-600 mb-1">N° de Cuenta</label>
                    <input type="text" name="account_code" id="account_code" value="${UI.h(accountCode)}" list="accounts_list" placeholder="Código" autocomplete="off" class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border" required>
                    <datalist id="accounts_list">
                        ${accounts.map(function (acc) { return `<option value="${UI.h(acc.code)}">${UI.h(acc.name)}</option>`; }).join('')}
                    </datalist>
                </div>
                <div>
                    <label for="ledger_month" class="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
                    <select name="month" id="ledger_month" class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border" required>
                        ${monthOptions.join('')}
                    </select>
                </div>
                <div>
                    <label for="ledger_year" class="block text-xs font-semibold text-slate-600 mb-1">Año</label>
                    <input type="number" name="year" id="ledger_year" value="${UI.h(year)}" class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border" required>
                </div>
                <div class="flex items-end">
                    <button type="submit" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition">
                        Generar Mayor &rarr;
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
  };

  window.Views.dateRangeForm = function (ctx) {
    const owner = Store.activeOwner();
    const query = ctx.query || {};
    const isoDate = UI.today();
    const monthPrefix = isoDate.slice(0, 7);
    const lastDay = new Date(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)), 0).getDate();
    const dateFrom = query.date_from === undefined || query.date_from === '' ? monthPrefix + '-01' : query.date_from;
    const dateTo = query.date_to === undefined || query.date_to === '' ? monthPrefix + '-' + String(lastDay).padStart(2, '0') : query.date_to;

    return `
    <div class="max-w-md w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.journal_context'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver
            </a>
        </div>

        <div class="text-center mb-6">
            <h1 class="text-xl font-extrabold text-slate-800">Libro Diario</h1>
            <p class="text-xs text-slate-500 mt-1">Selecciona el rango de fechas para generar el registro</p>
        </div>

        <form data-action="vc_documents.journal_book.generate" class="space-y-4">
            <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">
            <div>
                <label for="date_from" class="block text-xs font-semibold text-slate-600 mb-1">Fecha de Inicio</label>
                <input type="date" name="date_from" id="date_from" value="${UI.h(dateFrom)}" required class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2.5 bg-white border focus:border-emerald-500 focus:ring-emerald-500">
            </div>

            <div>
                <label for="date_to" class="block text-xs font-semibold text-slate-600 mb-1">Fecha de Término</label>
                <input type="date" name="date_to" id="date_to" value="${UI.h(dateTo)}" required class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2.5 bg-white border focus:border-emerald-500 focus:ring-emerald-500">
            </div>

            <div class="pt-4">
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center">
                    Generar Libro Diario &rarr;
                </button>
            </div>
        </form>
    </div>
    `;
  };

  window.Views.systemConfig = function (ctx) {
    return `
    <div class="max-w-2xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('welcome'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">&larr; Volver al Inicio</a>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800">Configuración General del Sistema</h1>
            <p class="text-sm text-slate-500 mt-1">Administra los parámetros maestros y estructuras globales</p>
        </div>

        <div class="grid grid-cols-1 gap-4">
            <a href="${UI.h(UI.route('masters.account_templates.index'))}" class="flex items-center justify-between p-5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition group shadow-sm">
                <div>
                    <h2 class="text-sm font-bold text-slate-800 group-hover:text-amber-800">Planes de Cuentas Maestros</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Gestiona y edita las plantillas base utilizadas para clonar cuentas al crear nuevas empresas.</p>
                </div>
                <span class="text-amber-600 font-bold text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
            </a>

            <a href="${UI.h(UI.route('system.database.export'))}" class="flex items-center justify-between p-5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition group shadow-sm">
                <div>
                    <h2 class="text-sm font-bold text-slate-800 group-hover:text-emerald-800">Exportar Base de Datos (MariaDB)</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Descarga un respaldo completo en formato SQL listo para restaurar en cualquier momento.</p>
                </div>
                <span class="text-emerald-600 font-bold text-lg group-hover:translate-x-1 transition-transform">&darr;</span>
            </a>
        </div>
    </div>
    `;
  };

  window.Views.documentCreate = function (ctx) {
    const owner = Store.activeOwner();
    const values = UI.old() || {};
    function value(name, fallback) {
      const stored = values[name];
      if (stored === undefined || stored === null || stored === '') return fallback === undefined ? '' : fallback;
      return stored;
    }
    function selected(name, expected, fallback) {
      return String(value(name, fallback)) === String(expected) ? ' selected' : '';
    }

    return `
    <header class="bg-white shadow mb-8">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Ingresar Documento V/C</h2>
            <div>
                <a href="${UI.h(UI.route('ingress.manual'))}" class="text-xs font-semibold bg-gray-100 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-200 transition shadow-sm">
                    &larr; Volver al Inicio
                </a>
            </div>
        </div>
    </header>

    <main class="py-4">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <form data-action="documents.store">
                    <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">1. Datos de Registro</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label for="month_register" class="block text-sm font-medium text-gray-700">Mes de Registro</label>
                            <input type="number" name="month_register" id="month_register" min="1" max="12" value="${UI.h(value('month_register', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label for="year_register" class="block text-sm font-medium text-gray-700">Año de Registro</label>
                            <input type="number" name="year_register" id="year_register" min="2000" value="${UI.h(value('year_register', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label for="type_vc" class="block text-sm font-medium text-gray-700">Tipo (V/C)</label>
                            <select name="type_vc" id="type_vc" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                <option value="V"${selected('type_vc', 'V', 'V')}>Venta</option>
                                <option value="C"${selected('type_vc', 'C', 'V')}>Compra</option>
                            </select>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">2. Detalles del Documento</h3>

                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-md mb-6">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Datos de la Entidad</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="rut" class="block text-sm font-medium text-gray-700">RUT (Ej: 12345678-9)</label>
                                <input type="text" name="rut" id="rut" maxlength="10" value="${UI.h(value('rut', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                <p id="rut_message" class="text-xs mt-1 h-4 text-gray-500"></p>
                            </div>
                            <div>
                                <label for="entity_name" class="block text-sm font-medium text-gray-700">Nombre o Razón Social</label>
                                <input type="text" name="entity_name" id="entity_name" value="${UI.h(value('entity_name', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors" required>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-md mb-6">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Tipo de Documento</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="doctype" class="block text-sm font-medium text-gray-700">Código (Doctype)</label>
                                <input type="number" name="doctype" id="doctype" value="${UI.h(value('doctype', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                <p id="doctype_message" class="text-xs mt-1 h-4 text-gray-500"></p>
                            </div>
                            <div>
                                <label for="document_type_name" class="block text-sm font-medium text-gray-700">Nombre del Documento</label>
                                <input type="text" name="document_type_name" id="document_type_name" value="${UI.h(value('document_type_name', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors" required>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label for="folio" class="block text-sm font-medium text-gray-700">Folio</label>
                            <input type="number" name="folio" id="folio" value="${UI.h(value('folio', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label for="date" class="block text-sm font-medium text-gray-700">Fecha Documento</label>
                            <input type="date" name="date" id="date" value="${UI.h(value('date', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">3. Referencias</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label for="rut_ref" class="block text-sm font-medium text-gray-700">RUT Ref</label>
                            <input type="text" name="rut_ref" id="rut_ref" maxlength="10" value="${UI.h(value('rut_ref', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="folio_ref" class="block text-sm font-medium text-gray-700">Folio Ref</label>
                            <input type="number" name="folio_ref" id="folio_ref" value="${UI.h(value('folio_ref', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="td_ref" class="block text-sm font-medium text-gray-700">Tipo Doc Ref</label>
                            <input type="text" name="td_ref" id="td_ref" maxlength="2" value="${UI.h(value('td_ref', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="date_centralize" class="block text-sm font-medium text-gray-700">Fecha Centralización</label>
                            <input type="date" name="date_centralize" id="date_centralize" value="${UI.h(value('date_centralize', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">4. Montos</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label for="net" class="block text-sm font-medium text-gray-700">Neto</label>
                            <input type="number" name="net" id="net" value="${UI.h(value('net', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="exempt" class="block text-sm font-medium text-gray-700">Exento</label>
                            <input type="number" name="exempt" id="exempt" value="${UI.h(value('exempt', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="vat_rec" class="block text-sm font-medium text-gray-700">IVA Recuperable</label>
                            <input type="number" name="vat_rec" id="vat_rec" value="${UI.h(value('vat_rec', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="vat_no_rec" class="block text-sm font-medium text-gray-700">IVA No Recup.</label>
                            <input type="number" name="vat_no_rec" id="vat_no_rec" value="${UI.h(value('vat_no_rec', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="plus_oth_tax" class="block text-sm font-medium text-gray-700">Otros Imp. (+)</label>
                            <input type="number" name="plus_oth_tax" id="plus_oth_tax" value="${UI.h(value('plus_oth_tax', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="minus_oth_tax" class="block text-sm font-medium text-gray-700">Otros Imp. (-)</label>
                            <input type="number" name="minus_oth_tax" id="minus_oth_tax" value="${UI.h(value('minus_oth_tax', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div class="col-span-2">
                            <label for="total" class="block text-sm font-bold text-gray-900">TOTAL</label>
                            <input type="number" name="total" id="total" value="${UI.h(value('total', '0'))}" class="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold" required>
                        </div>
                    </div>

                    <div class="flex justify-end pt-4 border-t">
                        <a href="${UI.h(UI.route('welcome'))}" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3">
                            Cancelar / Volver
                        </a>
                        <button type="submit" class="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Guardar Documento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <script>
    (function () {
      var config = ${UI.json({ ownerId: owner ? owner.id : null, workingYear: Store.workingYear() })};
      var yearInput = document.getElementById('year_register');
      if (yearInput && !yearInput.value) { yearInput.value = String(config.workingYear); }

      var rutInput = document.getElementById('rut');
      var nameInput = document.getElementById('entity_name');
      var rutMessage = document.getElementById('rut_message');
      if (rutInput && nameInput && rutMessage) {
        rutInput.addEventListener('blur', function () {
          var rutValue = this.value.trim();
          if (rutValue.length === 0) { rutMessage.textContent = ''; return; }
          rutMessage.textContent = 'Buscando...';
          rutMessage.className = 'text-xs mt-1 h-4 text-gray-500';
          var entity = Store.entityByRut(rutValue);
          if (entity) {
            nameInput.value = entity.name || '';
            nameInput.setAttribute('readonly', 'readonly');
            nameInput.classList.add('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            rutMessage.textContent = 'Entidad cargada.';
            rutMessage.className = 'text-xs mt-1 h-4 text-green-600 font-medium';
          } else {
            nameInput.value = '';
            nameInput.removeAttribute('readonly');
            nameInput.classList.remove('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            rutMessage.textContent = 'RUT nuevo. Ingrese el nombre para registrarlo.';
            rutMessage.className = 'text-xs mt-1 h-4 text-blue-600 font-medium';
            nameInput.focus();
          }
        });
      }

      var doctypeInput = document.getElementById('doctype');
      var docNameInput = document.getElementById('document_type_name');
      var doctypeMessage = document.getElementById('doctype_message');
      if (doctypeInput && docNameInput && doctypeMessage) {
        doctypeInput.addEventListener('blur', function () {
          var doctypeValue = this.value.trim();
          if (doctypeValue.length === 0) { doctypeMessage.textContent = ''; return; }
          doctypeMessage.textContent = 'Buscando...';
          doctypeMessage.className = 'text-xs mt-1 h-4 text-gray-500';
          var documentType = Store.documentTypeByDoctype(doctypeValue);
          if (documentType) {
            docNameInput.value = documentType.name || '';
            docNameInput.setAttribute('readonly', 'readonly');
            docNameInput.classList.add('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            doctypeMessage.textContent = 'Tipo de documento cargado.';
            doctypeMessage.className = 'text-xs mt-1 h-4 text-green-600 font-medium';
          } else {
            docNameInput.value = '';
            docNameInput.removeAttribute('readonly');
            docNameInput.classList.remove('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            doctypeMessage.textContent = 'Código nuevo. Ingrese el nombre para registrarlo.';
            doctypeMessage.className = 'text-xs mt-1 h-4 text-blue-600 font-medium';
            docNameInput.focus();
          }
        });
      }
    })();
    </script>
    `;
  };

  window.Views.documentPending = function (ctx) {
    const owner = Store.activeOwner();
    const query = ctx.query || {};
    const documentTypes = Store.documentTypes();
    const accounts = Store.activeOwnerAccounts();
    const filters = {};
    if (query.rut !== undefined && query.rut !== '') filters.rut = query.rut;
    if (query.document_type_id !== undefined && query.document_type_id !== '') filters.document_type_id = query.document_type_id;
    if (query.date !== undefined && query.date !== '') filters.date = query.date;
    if (query.folio !== undefined && query.folio !== '') filters.folio = query.folio;
    const documents = Store.pendingDocuments(filters);
    const glosa = UI.old('glosa', 'Contabilización de documentos V/C');

    const rows = documents.length
      ? documents.map(function (doc) {
          const entity = doc.entity || {};
          const typeClass = doc.type_vc === 'V' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
          return `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-4 py-3 text-center">
                                    <input type="checkbox" name="document_ids[]" value="${UI.h(doc.id)}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 doc-checkbox">
                                </td>
                                <td class="px-6 py-3 font-bold text-gray-900">${UI.h(doc.folio)}</td>
                                <td class="px-6 py-3 text-gray-700">
                                    <span class="font-semibold">${UI.h(entity.name || 'S/N')}</span>
                                    <span class="block text-[11px] text-gray-400">${UI.h(entity.rut || '')}</span>
                                </td>
                                <td class="px-6 py-3">
                                    <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${typeClass}">
                                        ${UI.h(doc.type_vc === 'V' ? 'Venta' : 'Compra')}
                                    </span>
                                </td>
                                <td class="px-6 py-3 text-gray-600">${UI.h(doc.date)}</td>
                                <td class="px-6 py-3 text-right text-gray-600">${UI.h(UI.number(doc.net))}</td>
                                <td class="px-6 py-3 text-right text-gray-600">${UI.h(UI.number(doc.vat_rec))}</td>
                                <td class="px-6 py-3 text-right font-bold text-gray-900">${UI.h(UI.number(doc.total))}</td>
                            </tr>`;
        }).join('')
      : `
                            <tr>
                                <td colspan="8" class="px-6 py-10 text-center text-sm text-gray-500">
                                    No hay documentos pendientes que coincidan con los filtros aplicados.
                                </td>
                            </tr>`;

    return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Documentos V/C Pendientes de Contabilización</h2>
                <p class="text-sm text-gray-500 mt-1">Periodo tributario año: <span class="font-bold text-blue-600">${UI.h(Store.workingYear())}</span></p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
            <form data-action="vc_documents.pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                    <label for="rut" class="block text-xs font-bold uppercase text-gray-600 mb-1">RUT Entidad</label>
                    <input type="text" name="rut" id="rut" value="${UI.h(query.rut || '')}" placeholder="Ej: 12345678" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
                <div>
                    <label for="document_type_id" class="block text-xs font-bold uppercase text-gray-600 mb-1">Tipo de Documento</label>
                    <select name="document_type_id" id="document_type_id" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                        <option value="">Todos los tipos</option>
                        ${documentTypes.map(function (dt) {
                          return `<option value="${UI.h(dt.doctype)}"${String(query.document_type_id || '') === String(dt.doctype) ? ' selected' : ''}>${UI.h(dt.doctype)} - ${UI.h(dt.name)}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div>
                    <label for="date" class="block text-xs font-bold uppercase text-gray-600 mb-1">Fecha</label>
                    <input type="date" name="date" id="date" value="${UI.h(query.date || '')}" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                </div>
                <div>
                    <label for="folio" class="block text-xs font-bold uppercase text-gray-600 mb-1">Folio</label>
                    <input type="number" name="folio" id="folio" value="${UI.h(query.folio || '')}" placeholder="N° Folio" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
                <div class="flex space-x-2">
                    <button type="submit" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg shadow transition">
                        Filtrar
                    </button>
                    <a href="${UI.h(UI.route('vc_documents.pending'))}" class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center">
                        Limpiar
                    </a>
                </div>
            </form>
        </div>

        <form data-action="documents.batch">
            <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="custom_net_account" class="block text-xs font-bold uppercase text-gray-700 mb-1">
                            Cuenta Contable para el Neto <span class="font-normal text-gray-400">(Seleccione o escriba el código)</span>
                        </label>
                        <div class="relative">
                            <input type="text" name="custom_net_account" id="custom_net_account" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" list="accounts_list" placeholder="Ej: Seleccione o escriba código" autocomplete="off" required>

                            <datalist id="accounts_list">
                                ${accounts.map(function (acc) { return `<option value="${UI.h(acc.code)}">${UI.h(acc.code)} - ${UI.h(acc.name)}</option>`; }).join('')}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label for="glosa" class="block text-xs font-bold uppercase text-gray-700 mb-1">
                            Glosa / Descripción General para los Asientos
                        </label>
                        <input type="text" name="glosa" id="glosa" value="${UI.h(glosa)}" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" required placeholder="Ej: Facturas recibidas del periodo">
                    </div>
                </div>

                <div class="flex justify-end pt-2 border-t border-gray-100">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition uppercase tracking-wider">
                        Contabilizar Seleccionados
                    </button>
                </div>
            </div>

            <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200 text-left text-xs">
                    <thead class="bg-gray-800 text-white">
                        <tr>
                            <th scope="col" class="w-12 px-4 py-3 text-center">
                                <input type="checkbox" id="select-all" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            </th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Folio</th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Entidad / RUT</th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Tipo V/C</th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Fecha Doc.</th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider text-right">Neto</th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider text-right">IVA Rec.</th>
                            <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                        ${rows}
                    </tbody>
                </table>
            </div>
        </form>
    </div>

    <script>
    (function () {
      var selectAll = document.getElementById('select-all');
      if (!selectAll) { return; }
      selectAll.addEventListener('change', function () {
        var checkboxes = document.querySelectorAll('.doc-checkbox');
        for (var index = 0; index < checkboxes.length; index++) {
          checkboxes[index].checked = selectAll.checked;
        }
      });
    })();
    </script>
    `;
  };

  window.Views.journalBook = function (ctx) {
    const owner = Store.activeOwner();
    const query = ctx.query || {};
    const workingYear = Store.workingYear();
    const dateFrom = query.date_from === undefined ? '' : query.date_from;
    const dateTo = query.date_to === undefined ? '' : query.date_to;
    const options = { year: workingYear };
    if (owner) options.owner_id = owner.id;
    if (dateFrom !== '' && dateTo !== '') {
      options.date_from = dateFrom;
      options.date_to = dateTo;
    }
    const journals = Store.journals(options);
    const exportHref = UI.route('vc_documents.export_csv', { date_from: dateFrom, date_to: dateTo });
    const generateHref = UI.route('vc_documents.journal_book.generate', { date_from: dateFrom, date_to: dateTo });
    const rangeLabel = dateFrom !== '' && dateTo !== ''
      ? `<span class="ml-2 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">Desde: ${UI.h(dateFrom)} hasta ${UI.h(dateTo)}</span>`
      : '';

    const rows = journals.length
      ? journals.map(function (journal) {
          const doc = journal.document || null;
          const docTypeName = doc ? (doc.documentType && doc.documentType.name ? doc.documentType.name : doc.document_type_id) : '';
          const docRut = doc && doc.entity ? doc.entity.rut : 'N/A';
          const balanceClass = journal.is_balanced ? 'text-green-600' : 'text-red-600';
          const balanceText = journal.is_balanced ? '● Cuadrado' : '● Descuadrado';
          const docBlock = doc
            ? `
                                        <span class="text-gray-500 font-normal ml-2">
                                            (Doc: <span class="font-semibold text-gray-700">${UI.h(docTypeName)}</span>
                                            | RUT: <span class="font-semibold text-gray-700">${UI.h(docRut)}</span>
                                            | Folio:
                                            <a href="${UI.h(UI.route('accounting.documents.detail', doc.id))}" class="text-indigo-600 hover:underline font-bold">
                                                ${UI.h(doc.folio)}
                                            </a>)
                                        </span>`
            : '';
          const descriptionBlock = journal.description
            ? `<span class="text-gray-600 font-normal ml-2">— ${UI.h(journal.description)}</span>`
            : '';
          const entries = (journal.entries || []).map(function (entry) {
            const accountName = entry.account && entry.account.name ? entry.account.name : 'Sin nombre';
            return `
                                <tr class="hover:bg-gray-50/80 transition">
                                    <td class="py-2 px-4 font-mono text-gray-600 font-medium">${UI.h(entry.account_code)}</td>
                                    <td class="py-2 px-4 text-gray-900 font-sans">${UI.h(accountName)}</td>
                                    <td class="py-2 px-4 text-right font-mono text-gray-800">${UI.h(entry.debit ? UI.number(entry.debit) : '-')}</td>
                                    <td class="py-2 px-4 text-right font-mono text-gray-800">${UI.h(entry.credit ? UI.number(entry.credit) : '-')}</td>
                                </tr>`;
          }).join('');

          return `
                            <tr class="bg-gray-100 font-semibold text-gray-800">
                                <td colspan="4" class="py-2.5 px-4 text-xs">
                                    Asiento N° <span class="font-bold text-indigo-700">${UI.h(journal.entry_number)}</span>
                                    <span class="mx-1 text-gray-400">|</span> Fecha: <span class="font-normal">${UI.h(journal.date)}</span>
                                    ${docBlock}
                                    ${descriptionBlock}
                                    <span class="float-right font-bold ${balanceClass}">
                                        ${UI.h(balanceText)}
                                    </span>
                                </td>
                            </tr>
                            ${entries}
                            <tr class="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-mono text-[11px]">
                                <td class="py-2 px-4"></td>
                                <td class="py-2 px-4 italic font-sans font-medium text-gray-500">Total Asiento N° ${UI.h(journal.entry_number)}:</td>
                                <td class="py-2 px-4 text-right font-bold text-indigo-600">${UI.h(UI.number(journal.total_debit))}</td>
                                <td class="py-2 px-4 text-right font-bold text-indigo-600">${UI.h(UI.number(journal.total_credit))}</td>
                            </tr>`;
        }).join('')
      : `
                            <tr>
                                <td colspan="4" class="text-center py-12 text-gray-400 text-sm">
                                    No hay registros en el libro diario para el periodo o rango seleccionado.
                                </td>
                            </tr>`;

    return `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 mb-6 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Libro Diario Contable</h1>
                <p class="text-xs text-gray-500 mt-1">
                    Periodo año: <span class="font-bold text-indigo-600">${UI.h(workingYear)}</span>
                    ${rangeLabel}
                </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <a href="${UI.h(exportHref)}" class="inline-flex items-center text-xs font-semibold bg-green-600 text-white px-3.5 py-2 rounded-lg shadow-sm hover:bg-green-700 transition">
                    Exportar a CSV
                </a>
                <a href="${UI.h(generateHref)}" class="inline-flex items-center text-xs font-semibold bg-indigo-600 text-white px-3.5 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">
                    Generar Libro
                </a>
                <a href="${UI.h(UI.route('vc_documents.pending'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    Pendientes
                </a>
                <a href="${UI.h(UI.route('vc_documents.journal_book.form'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Cambiar Rango
                </a>
            </div>
        </div>

        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs table-auto">
                    <thead>
                        <tr class="bg-gray-800 text-white uppercase tracking-wider text-[11px]">
                            <th class="py-3 px-4 w-32">Código</th>
                            <th class="py-3 px-4">Nombre de Cuenta</th>
                            <th class="py-3 px-4 text-right w-28">Debe</th>
                            <th class="py-3 px-4 text-right w-28">Haber</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
  };
})();
