# AGENTS.md

## Workspace / misión
- La raíz es el port a escritorio de Plasticina y debe implementarse solo con HTML, CSS y JavaScript. No usar PHP en el código del port.
- `plasticina-master/` es la app Laravel/MariaDB original: referencia de comportamiento e identidad visual, pero no se modifica.
- La identidad visual debe conservarse; `assets/styles/app.css` contiene los estilos derivados de las clases Tailwind originales.

## Arquitectura del port
- `index.html` es el único documento de la app; carga los scripts en este orden: núcleo (`core/`), datos (`data/`), almacén (`store/`), vistas (`views/`), acciones (`actions/`) y aplicación (`app/`).
- `assets/core/namespace.js`: espacios de nombre (`window.Plasticina`) usados por los módulos; evita colisiones entre contextos.
- `assets/core/ui/`: módulos pequeños de rutas, formato, sesión, formularios y descargas; `index.js` compone `window.UI`. Las rutas son hash (`#/...`).
- `assets/data/`: plan de cuentas sembrado y plantillas de asientos manuales.
- `assets/store/`: `context.js` concentra el estado y helpers primitivos; `masters.js`, `documents.js`, `journals.js`, `accounting.js` y `csv.js` aportan la lógica contable; `index.js` publica `window.Store`.
- `assets/views/`: una vista por archivo, separada por contexto (home, ingress, reports, documents, accounting, owners, masters, system); `shared/helpers.js` contiene los helpers de render. Todas se montan en `window.Views`.
- `assets/actions/`: `helpers.js` y un archivo por contexto; se montan en `window.Actions`.
- `assets/app/`: configuración de rutas, router, eventos, exportación CSV y arranque.
- `assets/tests/`: page de pruebas (`index.html`), harness y suites por contexto; `test/run.js` ejecuta las mismas suites en Node sin dependencias.
- `desktop/main.js`: ventana Electron que carga `index.html` con `loadFile`; no levanta servidores.

## Datos y persistencia
- No hay base de datos externa. El estado vive en `localStorage` bajo `plasticina_desktop_store_v1`.
- El estado incluye owners, cuentas, entidades, tipos de documento, documentos V/C, asientos, entradas, plantillas y año de trabajo.
- Seed inicial: owner `55555555-5` / `Test`, 161 cuentas, año de trabajo igual al año actual.

## Comandos
- Instalar y ejecutar: `npm install && npm start`.
- Empaquetar: `npm run dist`.
- Pruebas: `npm test` (Node) y `npm run test:static` (Python, sin dependencias).
- También se puede abrir `index.html` directamente en un navegador moderno.

## Verificación
- Tras cualquier cambio, ejecutar `npm test` y `npm run test:static`; también se puede abrir `assets/tests/index.html` en el navegador.
- Si Node vuelve a estar disponible en el entorno, ejecutar además `node --check` sobre cada archivo de `assets/` y `desktop/main.js`.
- Al añadir scripts, actualizar `index.html` y `assets/tests/index.html` con el mismo orden: `test/check_static.py` verifica que coincidan.
- No generar archivos PHP ni reintroducir dependencias del servidor Laravel.
