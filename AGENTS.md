# AGENTS.md

## Workspace / misión
- La raíz es el port a escritorio de Plasticina y debe implementarse solo con HTML, CSS y JavaScript. No usar PHP en el código del port.
- `plasticina-master/` es la app Laravel/MariaDB original: referencia de comportamiento e identidad visual, pero no se modifica.
- La identidad visual debe conservarse; `assets/app.css` contiene los estilos derivados de las clases Tailwind originales.

## Arquitectura del port
- `index.html` es el único documento; carga los scripts en este orden: `ui.js`, `seed.js`, `store.js`, vistas, `actions.js`, `app.js`.
- `assets/ui.js`: helpers globales (`h`, `route`, `json`, `number`, `money`, `flash`, `old`, `entriesFrom`). Las rutas son hash (`#/...`).
- `assets/seed.js`: plan de cuentas sembrado y plantillas de asientos manuales.
- `assets/store.js`: estado en localStorage con fallback en memoria; contiene la lógica contable (documentos V/C, asientos, pagos, balance tributario, CSV).
- `assets/views-*.js`: funciones que devuelven fragmentos HTML; se montan en `window.Views`.
- `assets/actions.js`: manejadores de formularios; se montan en `window.Actions`.
- `assets/app.js`: router hash, montaje de vistas, ejecución de scripts inline y exportación CSV.
- `desktop/main.js`: ventana Electron que carga `index.html` con `loadFile`; no levanta servidores.

## Datos y persistencia
- No hay base de datos externa. El estado vive en `localStorage` bajo `plasticina_desktop_store_v1`.
- El estado incluye owners, cuentas, entidades, tipos de documento, documentos V/C, asientos, entradas, plantillas y año de trabajo.
- Seed inicial: owner `55555555-5` / `Test`, 161 cuentas, año de trabajo igual al año actual.

## Comandos
- Instalar y ejecutar: `npm install && npm start`.
- Empaquetar: `npm run dist`.
- También se puede abrir `index.html` directamente en un navegador moderno.

## Verificación
- `node`, `npm` y `php` no estaban disponibles en el entorno inicial; usar comprobaciones estáticas hasta que estén disponibles.
- Al verificar con Node, ejecutar `node --check` sobre cada archivo de `assets/` y `desktop/main.js`.
- No generar archivos PHP ni reintroducir dependencias del servidor Laravel.
