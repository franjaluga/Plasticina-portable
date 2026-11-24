(function () {
  'use strict';

  window.Views = window.Views || {};

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
                    <h2 class="text-sm font-bold text-slate-800 group-hover:text-emerald-800">Exportar Base de Datos (SQLite)</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Descarga el archivo SQLite completo con todas las empresas, documentos y asientos.</p>
                </div>
                <span class="text-emerald-600 font-bold text-lg group-hover:translate-x-1 transition-transform">&darr;</span>
            </a>

            <form data-action="system.sqlite-import" enctype="multipart/form-data" class="p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                <h2 class="text-sm font-bold text-slate-800">Restaurar Base de Datos (SQLite)</h2>
                <p class="text-xs text-slate-500 mt-0.5 mb-3">Reemplaza la base de datos actual con un respaldo <code>.sqlite</code>.</p>
                <input type="file" name="sqlite_file" accept=".sqlite,.db,application/x-sqlite3" class="block w-full text-xs text-slate-600 mb-3">
                <button type="submit" class="inline-flex items-center text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">Restaurar respaldo</button>
            </form>

            <div class="p-5 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
                <h2 class="text-sm font-bold text-slate-800">Reiniciar Base de Datos</h2>
                <p class="text-xs text-slate-500 mt-0.5 mb-3">Elimina todas las empresas distintas a la sembrada y deja la base como en el primer uso. Esta acción no se puede deshacer.</p>
                <button type="button" onclick="openResetDatabaseModal()" class="inline-flex items-center text-xs font-semibold bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition">Reiniciar base de datos</button>
            </div>
        </div>
    </div>

    <div id="resetDatabaseModal" class="fixed inset-0 z-50 hidden bg-slate-900/50 flex items-center justify-center p-4" style="display:none" aria-hidden="true">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex justify-between items-center">
                <h3 class="text-base font-bold text-slate-800">Reiniciar base de datos</h3>
                <button type="button" onclick="closeResetDatabaseModal()" class="text-slate-400 hover:text-slate-700 font-bold">&times;</button>
            </div>
            <div id="resetStepOne" class="mt-4">
                <p class="text-sm text-slate-600">Se eliminarán todas las empresas distintas a la sembrada, junto con sus documentos, asientos y cuentas. La base quedará como si fuera el primer uso.</p>
                <div class="flex justify-between items-center mt-6 gap-3">
                    <button type="button" data-reset-step="1" data-reset-advance class="inline-flex items-center text-xs font-semibold bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition">Confirmar</button>
                    <button type="button" onclick="closeResetDatabaseModal()" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition">Cancelar</button>
                </div>
            </div>
            <div id="resetStepTwo" class="mt-4 hidden" style="display:none">
                <p class="text-sm text-red-700 font-semibold">Última confirmación: se borrarán los datos actuales y se restaurará el owner sembrado con sus 161 cuentas.</p>
                <div class="flex justify-between items-center mt-6 gap-3">
                    <button type="button" data-reset-back class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition">Cancelar</button>
                    <button type="button" data-reset-step="2" data-link-action="system.reset" class="inline-flex items-center text-xs font-semibold bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition">Confirmar</button>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function () {
      const modal = document.getElementById('resetDatabaseModal');
      const stepOne = document.getElementById('resetStepOne');
      const stepTwo = document.getElementById('resetStepTwo');
      if (!modal || !stepOne || !stepTwo) return;

      function showStep(step) {
        const first = step === 1;
        stepOne.classList.toggle('hidden', !first);
        stepOne.style.display = first ? 'block' : 'none';
        stepTwo.classList.toggle('hidden', first);
        stepTwo.style.display = first ? 'none' : 'block';
      }

      function openResetDatabaseModal() {
        showStep(1);
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
      }

      function closeResetDatabaseModal() {
        showStep(1);
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }

      window.openResetDatabaseModal = openResetDatabaseModal;
      window.closeResetDatabaseModal = closeResetDatabaseModal;

      Array.prototype.forEach.call(modal.querySelectorAll('[data-reset-advance]'), function (button) {
        button.addEventListener('click', function () { showStep(2); });
      });
      Array.prototype.forEach.call(modal.querySelectorAll('[data-reset-back]'), function (button) {
        button.addEventListener('click', closeResetDatabaseModal);
      });
      modal.addEventListener('click', function (event) {
        if (event.target === modal) closeResetDatabaseModal();
      });
      if (!window.__systemResetModalKeysBound) {
        window.__systemResetModalKeysBound = true;
        document.addEventListener('keydown', function (event) {
          if (event.key !== 'Escape') return;
          const current = document.getElementById('resetDatabaseModal');
          if (current && current.getAttribute('aria-hidden') === 'false') closeResetDatabaseModal();
        });
      }
    })();
    </script>
    `;
  };
})();
