(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, fail, readForm } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['system.sqlite-export'] = function () {
    UI.download('plasticina_backup_' + UI.today() + '.sqlite', Store.exportSqlite(), 'application/x-sqlite3');
    UI.flash('success', 'Respaldo SQLite descargado correctamente.');
    window.location.hash = UI.route('system.config');
  };

  window.Actions['system.sqlite-import'] = function (form) {
    const input = form.elements.sqlite_file;
    const file = input && input.files ? input.files[0] : null;
    if (!file) {
      fail(new Error('Debe seleccionar un archivo SQLite.'), readForm(form));
      return;
    }
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        await Store.importSqlite(new Uint8Array(reader.result || []));
        afterSuccess('Base de datos SQLite importada correctamente.', 'welcome');
      } catch (error) {
        fail(error, readForm(form));
      }
    };
    reader.onerror = function () { fail(new Error('No se pudo leer el archivo SQLite.'), readForm(form)); };
    reader.readAsArrayBuffer(file);
  };

  window.Actions['system.export'] = function () {
    UI.download('plasticina_backup_' + UI.today() + '.json', Store.exportJson(), 'application/json;charset=utf-8');
    UI.flash('success', 'Respaldo JSON descargado correctamente.');
    window.location.hash = UI.route('system.config');
  };

  window.Actions['system.import'] = function (form) {
    const input = form.elements.backup_file;
    const file = input && input.files ? input.files[0] : null;
    if (!file) {
      fail(new Error('Debe seleccionar un respaldo JSON.'), readForm(form));
      return;
    }
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        await Store.importJson(Store.decodeText(reader.result));
        afterSuccess('Respaldo importado correctamente.', 'welcome');
      } catch (error) {
        fail(error, readForm(form));
      }
    };
    reader.onerror = function () { fail(new Error('No se pudo leer el respaldo.'), readForm(form)); };
    reader.readAsArrayBuffer(file);
  };

  window.Actions['system.reset'] = async function () {
    await Store.reset();
    afterSuccess('Base de datos reiniciada correctamente.', 'welcome');
  };

})();
