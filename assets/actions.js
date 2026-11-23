window.Actions = (function () {
  'use strict';

  function readForm(form) {
    const result = {};
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index];
      if (!element.name || element.type === 'file') continue;
      if (element.type === 'checkbox') {
        if (/\]$/.test(element.name)) {
          if (!Array.isArray(result[element.name])) result[element.name] = [];
          if (element.checked) result[element.name].push(element.value);
        } else {
          result[element.name] = element.checked ? element.value : '';
        }
        continue;
      }
      if (element.type === 'radio' && !element.checked) continue;
      result[element.name] = element.value;
    }
    return result;
  }

  function grouped(form, prefix) {
    const result = [];
    const pattern = new RegExp('^' + prefix + '\\[([^\\]]+)\\]\\[(\\w+)\\]$');
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index];
      const match = pattern.exec(element.name || '');
      if (!match) continue;
      let item = result.find(function (entry) { return entry._key === match[1]; });
      if (!item) {
        item = { _key: match[1] };
        result.push(item);
      }
      item[match[2]] = element.value;
    }
    return result;
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function integer(value) {
    return Math.trunc(number(value));
  }

  function afterSuccess(message, routeName, parameters) {
    UI.flash('success', message);
    if (routeName) {
      window.location.hash = UI.route(routeName, parameters);
    } else if (window.App) {
      window.App.render();
    }
  }

  function fail(error, values) {
    UI.remember(values || {});
    UI.flash('error', error && error.message ? error.message : String(error));
    if (window.App) window.App.render();
  }

  function run(form, callback) {
    const values = readForm(form);
    UI.remember(values);
    try {
      callback(values);
    } catch (error) {
      fail(error, values);
    }
  }

  const handlers = {
    'period.update': function (form) {
      run(form, function (values) {
        const year = integer(values.working_year);
        if (year < 2000) throw new Error('El año de trabajo debe ser mayor o igual a 2000.');
        Store.setWorkingYear(year);
        afterSuccess('Año de trabajo actualizado.', 'welcome');
      });
    },

    'owners.store': function (form) {
      run(form, function (values) {
        if (!values.rut || !values.name || !values.account_plan_type) throw new Error('Complete todos los campos obligatorios.');
        if (Store.owners().some(function (owner) { return owner.rut === values.rut; })) throw new Error('Ya existe una empresa con ese RUT.');
        const plan = Store.accountPlan(values.account_plan_type);
        const ownerId = Store.nextId('owners');
        Store.state.owners.push({
          id: ownerId,
          rut: values.rut,
          name: values.name,
          account_plan_type: values.account_plan_type,
          is_active: false
        });
        plan.forEach(function (account) {
          Store.state.accounts.push({
            id: Store.nextId('accounts'),
            owner_id: ownerId,
            code: account.code,
            name: account.name,
            category: account.category
          });
        });
        Store.save();
        afterSuccess('Owner y su plan de cuentas inicial creado exitosamente.', 'owners.index');
      });
    },

    'owners.update': function (form) {
      run(form, function (values) {
        const owner = Store.owner(integer(values.owner_id));
        if (!owner) throw new Error('Empresa no encontrada.');
        if (Store.owners().some(function (item) { return item.rut === values.rut && item.id !== owner.id; })) throw new Error('Ya existe una empresa con ese RUT.');
        owner.rut = values.rut;
        owner.name = values.name;
        Store.save();
        afterSuccess('Owner actualizado exitosamente.', 'owners.index');
      });
    },

    'owners.activate': function (form) {
      run(form, function (values) {
        const id = integer(values.owner_id);
        Store.state.owners.forEach(function (owner) { owner.is_active = owner.id === id; });
        Store.state.settings.activeOwnerId = id;
        Store.save();
        afterSuccess('Owner activado correctamente.', 'owners.index');
      });
    },

    'owners.destroy': function (form) {
      run(form, function (values) {
        const id = integer(values.owner_id);
        if (!Store.owner(id)) throw new Error('Empresa no encontrada.');
        if (Store.state.journals.some(function (journal) { return journal.owner_id === id; })) throw new Error('No se puede eliminar la empresa porque tiene asientos contables registrados.');
        Store.state.accounts = Store.state.accounts.filter(function (account) { return account.owner_id !== id; });
        Store.state.owners = Store.state.owners.filter(function (owner) { return owner.id !== id; });
        if (Store.state.settings.activeOwnerId === id) {
          const next = Store.owners()[0];
          Store.state.settings.activeOwnerId = next ? next.id : null;
          if (next) next.is_active = true;
        }
        Store.save();
        afterSuccess('Empresa eliminada correctamente.', 'owners.index');
      });
    },

    'accounts.store': function (form) {
      run(form, function (values) {
        const ownerId = integer(values.owner_id);
        if (!ownerId) throw new Error('Seleccione una empresa.');
        if (!values.code || !values.name) throw new Error('Complete código y nombre de la cuenta.');
        if (Store.accounts(ownerId).some(function (account) { return account.code === values.code; })) throw new Error('Ya existe esa cuenta para esta empresa.');
        Store.state.accounts.push({
          id: Store.nextId('accounts'),
          owner_id: ownerId,
          code: values.code,
          name: values.name,
          category: values.category || 'activo'
        });
        Store.save();
        afterSuccess('Cuenta contable creada exitosamente para esta empresa.');
      });
    },

    'accounts.update': function (form) {
      run(form, function (values) {
        const account = Store.account(integer(values.account_id));
        if (!account) throw new Error('Cuenta no encontrada.');
        if (Store.accounts(account.owner_id).some(function (item) { return item.code === values.code && item.id !== account.id; })) throw new Error('Ya existe esa cuenta para esta empresa.');
        const used = Store.state.journalEntries.some(function (entry) {
          if (entry.account_code !== account.code) return false;
          const journal = Store.state.journals.find(function (item) { return item.id === entry.journal_id; });
          return journal && journal.owner_id === account.owner_id;
        });
        if (used && account.code !== values.code) throw new Error('El código de la cuenta tiene movimientos y no puede modificarse.');
        account.code = values.code;
        account.name = values.name;
        account.category = values.category || 'activo';
        Store.save();
        afterSuccess('Cuenta contable actualizada correctamente.');
      });
    },

    'accounts.destroy': function (form) {
      run(form, function (values) {
        const account = Store.account(integer(values.account_id));
        if (!account) throw new Error('Cuenta no encontrada.');
        const used = Store.state.journalEntries.some(function (entry) {
          if (entry.account_code !== account.code) return false;
          const journal = Store.state.journals.find(function (item) { return item.id === entry.journal_id; });
          return journal && journal.owner_id === account.owner_id;
        });
        if (used) throw new Error('No se puede eliminar la cuenta "' + account.code + ' - ' + account.name + '" porque tiene movimientos registrados.');
        Store.state.accounts = Store.state.accounts.filter(function (item) { return item.id !== account.id; });
        Store.save();
        afterSuccess('Cuenta contable eliminada exitosamente.');
      });
    },

    'documents.store': function (form) {
      run(form, function (values) {
        const data = Object.assign({}, values);
        delete data.owner_id;
        Store.createDocument(data);
        afterSuccess('Documento V/C guardado exitosamente.', 'vc_documents.create');
      });
    },

    'documents.csv': function (form) {
      const values = readForm(form);
      const input = form.elements.csv_file;
      const file = input && input.files ? input.files[0] : null;
      if (!file) {
        fail(new Error('Debe seleccionar un archivo CSV válido.'), values);
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const count = Store.importCsv(String(reader.result || ''));
          afterSuccess('¡CSV importado correctamente! Se ingresaron ' + count + ' documentos.', 'vc_documents.create');
        } catch (error) {
          fail(error, values);
        }
      };
      reader.onerror = function () { fail(new Error('No se pudo leer el archivo CSV.'), values); };
      reader.readAsText(file, 'UTF-8');
    },

    'documents.batch': function (form) {
      run(form, function (values) {
        const ids = Array.isArray(values['document_ids[]']) ? values['document_ids[]'] : [];
        if (ids.length === 0 || !values.custom_net_account || !values.glosa) throw new Error('Debe seleccionar documentos, una cuenta contable para el Neto y una glosa.');
        const result = Store.batchProcess(ids, values.custom_net_account, values.glosa);
        if (result.errors && result.errors.length) {
          UI.flash('error', result.errors.join(' | '));
        }
        afterSuccess('Se procesaron correctamente ' + result.success_count + ' documentos.', 'vc_documents.pending');
      });
    },

    'manualJournal.store': function (form) {
      run(form, function (values) {
        const entries = grouped(form, 'entries').map(function (entry) {
          return {
            account_code: entry.account_code,
            debit: number(entry.debit),
            credit: number(entry.credit)
          };
        });
        Store.registerManualJournal(integer(values.year), integer(values.month), values.date, values.glosa, entries);
        afterSuccess('Asiento contable manual creado exitosamente.', 'accounting.reports.index');
      });
    },

    'manualJournal.update': function (form) {
      run(form, function (values) {
        const entries = grouped(form, 'entries').map(function (entry) {
          return {
            account_code: entry.account_code,
            component_name: entry.component_name || 'manual',
            debit: number(entry.debit),
            credit: number(entry.credit)
          };
        });
        Store.updateManualJournal(integer(values.id), integer(values.year), integer(values.month), values.date, values.description, entries);
        afterSuccess('Asiento manual actualizado exitosamente.', 'accounting.system_journals');
      });
    },

    'journals.update': function (form) {
      run(form, function (values) {
        const entries = grouped(form, 'entries').map(function (entry) {
          return {
            account_code: entry.account_code,
            component_name: entry.component_name || 'custom',
            debit: number(entry.debit),
            credit: number(entry.credit)
          };
        });
        Store.updateJournal(integer(values.id), values.date, values.description, entries);
        afterSuccess('Asiento contable actualizado exitosamente.', 'accounting.system_journals');
      });
    },

    'journals.delete-only': function (form) {
      run(form, function (values) {
        Store.deleteJournal(integer(values.journal || values.id), false);
        afterSuccess('Asiento contable eliminado. El documento asociado quedó pendiente de contabilizar.', 'accounting.system_journals');
      });
    },

    'journals.delete-with-document': function (form) {
      run(form, function (values) {
        Store.deleteJournal(integer(values.journal || values.id), true);
        afterSuccess('El documento y su asiento contable han sido eliminados definitivamente.', 'accounting.system_journals');
      });
    },

    'payments.store': function (form) {
      run(form, function (values) {
        Store.processPayment(integer(values.document_id), number(values.amount), values.date, values.bank_account_code);
        afterSuccess('Pago/Cobro procesado y registrado contablemente con éxito.', 'accounting.payments.index');
      });
    },

    'templates.store': function (form) {
      run(form, function (values) {
        if (!values.name) throw new Error('El nombre del plan es obligatorio.');
        if (Store.templates().some(function (template) { return template.name === values.name; })) throw new Error('Ya existe un plan con ese nombre.');
        const slug = String(values.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (Store.templates().some(function (template) { return template.slug === slug; })) throw new Error('Ya existe un plan con ese identificador.');
        const templateId = Store.nextId('templates');
        Store.state.templates.push({
          id: templateId,
          slug: slug,
          name: values.name,
          description: values.description || ''
        });
        Store.accountPlan('standard_pyme').forEach(function (account) {
          Store.state.templateItems.push({
            id: Store.nextId('templateItems'),
            account_template_id: templateId,
            code: account.code,
            name: account.name,
            category: account.category
          });
        });
        Store.save();
        afterSuccess('Plan de cuentas creado y clonado exitosamente desde la base.', 'masters.account_templates.index');
      });
    },

    'templates.update': function (form) {
      run(form, function (values) {
        const template = Store.template(integer(values.account_template_id));
        if (!template) throw new Error('Plan no encontrado.');
        if (Store.templates().some(function (item) { return item.name === values.name && item.id !== template.id; })) throw new Error('Ya existe un plan con ese nombre.');
        template.name = values.name;
        template.description = values.description || '';
        const items = grouped(form, 'items');
        const existing = [];
        items.forEach(function (item) {
          if (String(item._key).indexOf('new_') === 0) {
            Store.state.templateItems.push({
              id: Store.nextId('templateItems'),
              account_template_id: template.id,
              code: item.code || '',
              name: item.name || '',
              category: item.category || 'activo'
            });
            return;
          }
          const current = Store.state.templateItems.find(function (row) { return row.id === Number(item._key) && row.account_template_id === template.id; });
          if (!current) return;
          current.code = item.code || '';
          current.name = item.name || '';
          current.category = item.category || 'activo';
          existing.push(current.id);
        });
        Store.state.templateItems = Store.state.templateItems.filter(function (row) {
          return row.account_template_id !== template.id || existing.indexOf(row.id) !== -1;
        });
        Store.save();
        afterSuccess('Plan de cuentas actualizado correctamente.', 'masters.account_templates.index');
      });
    },

    'templates.destroy': function (form) {
      run(form, function (values) {
        const id = integer(values.account_template_id);
        Store.state.templateItems = Store.state.templateItems.filter(function (item) { return item.account_template_id !== id; });
        Store.state.templates = Store.state.templates.filter(function (template) { return template.id !== id; });
        Store.save();
        afterSuccess('Plan maestro eliminado exitosamente.', 'masters.account_templates.index');
      });
    },

    'system.export': function () {
      UI.download('plasticina_backup_' + UI.today() + '.json', Store.exportJson(), 'application/json;charset=utf-8');
      UI.flash('success', 'Respaldo JSON descargado correctamente.');
      window.location.hash = UI.route('system.config');
    },

    'system.import': function (form) {
      const input = form.elements.backup_file;
      const file = input && input.files ? input.files[0] : null;
      if (!file) {
        fail(new Error('Debe seleccionar un respaldo JSON.'), readForm(form));
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          Store.importJson(String(reader.result || ''));
          afterSuccess('Respaldo importado correctamente.', 'welcome');
        } catch (error) {
          fail(error, readForm(form));
        }
      };
      reader.onerror = function () { fail(new Error('No se pudo leer el respaldo.'), readForm(form)); };
      reader.readAsText(file, 'UTF-8');
    }
  };

  return Object.assign({ readForm: readForm, grouped: grouped }, handlers);
})();
