# AGENTS.md

## Workspace / misión
- La raíz es el port a escritorio (Electron + MySQLi); `plasticina-master/` es la app Laravel/MariaDB original y la referencia de comportamiento e identidad visual. El código del port se trabaja en la raíz, no dentro de `plasticina-master/`.
- La identidad visual debe conservarse: traducir Blade/Tailwind a CSS con refactorización. La UI original es Blade + Tailwind v4 vía Vite, sin Livewire/Inertia/Vue; el JS va inline en las vistas (`<script>`/fetch).
- Todavía no hay código Electron en la raíz (solo `README.md` y `plasticina-master/`); tampoco hay CI, git ni config local de OpenCode.

## Arquitectura de la referencia
- Todo el mapa HTTP está en `plasticina-master/routes/web.php` (no hay rutas API); closures para navegación/contexto y controladores por dominio en `app/Http/Controllers/{VCDocuments,Owners,Accounting,System}/`.
- La lógica de negocio vive en `app/Services/` (inyección por constructor, sin bindings personalizados); modelos agrupados en `app/Models/{Accounts,Accounting,Masters,Owners,VCDocuments}/`.
- Contexto global: primera empresa con `is_active=true` (`OwnerService`) más `session('working_year')`; no hay autenticación ni middleware registrado.
- `welcome.blade.php` es el hub de navegación; cada vista repite su HTML completo y su `@vite` (`layouts/app.blade.php` casi no se usa). Textos en español inline, sin `lang/`.

## Comandos (dentro de `plasticina-master/`)
- `composer setup`: install + `.env` + key + migrate + `npm install --ignore-scripts` + build. Para desarrollo: `php artisan serve` y `npm run dev`.
- Se recomienda MariaDB 11.8.8 con DB `utf8mb4` / `utf8mb4_unicode_ci`. `.env.example` tiene el bloque DB comentado: copiarlo, activar `DB_CONNECTION=mariadb` y credenciales antes de `php artisan migrate:fresh && php artisan key:generate && php artisan db:seed`.
- `composer test` = `artisan config:clear` + `artisan test` (Pest). Solo existen los `ExampleTest`; `phpunit.xml` fuerza sqlite `:memory:`, así que no validan el esquema MySQL. Pint está disponible como `vendor/bin/pint`; no hay scripts de lint/typecheck.
- `.npmrc` fija `ignore-scripts=true`; Vite 8 + Tailwind 4 compilan `resources/css/app.css` y `resources/js/app.js`.

## Gotchas al portear
- Las migraciones usan `enum`, `->after()` y charset MySQL; `config/database.php` defaults a sqlite y sesión/caché/cola usan tablas DB. `DatabaseBackupService` depende de `mysqldump` y de una conexión mysql/mariadb: rediseñarlo para desktop.
- `importadores/VC-importador.csv` es la plantilla de columnas que espera `VCDocumentService::importCsv` (importación transaccional toda-o-nada).
- No replicar bugs del original: `routes/web.php` registra `owners` dos veces (líneas 43 y 216); `AuditController::destroyJournalOnly` actualiza columnas inexistentes en `vc_documents`; `PaymentService` usa códigos `110102`/`210101` ausentes en el plan de cuentas sembrado (`1010401`/`2010201`).
