(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, grouped, integer, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['templates.store'] = function (form) {
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
  };

  window.Actions['templates.update'] = function (form) {
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
  };

  window.Actions['templates.destroy'] = function (form) {
    run(form, function (values) {
      const id = integer(values.account_template_id);
      Store.state.templateItems = Store.state.templateItems.filter(function (item) { return item.account_template_id !== id; });
      Store.state.templates = Store.state.templates.filter(function (template) { return template.id !== id; });
      Store.save();
      afterSuccess('Plan maestro eliminado exitosamente.', 'masters.account_templates.index');
    });
  };

})();
