# PixelStella development

Windows / Node.js 24+ / pnpm 11. Follow the installation and test commands in [README](../README.en.md). Electron installation is explicit; do not approve unrelated lifecycle scripts. Keep Electron's renderer sandbox and context isolation enabled.

| Directory | Responsibility |
|---|---|
| src/main | Electron lifecycle, validated IPC, atomic JSON storage, legacy profile copying, restricted local AI requests |
| src/shared | Strict models/validators, scheduling, original SVG character, zh/en/fr catalog |
| src/renderer | Main panel, pet, static DOM localization, typed bridge |
| scripts | TypeScript build, original icon generation, Windows portable packaging, clean source export |
| tests | Core and migration tests, desktop workflows, language/accessibility/layout tests, delivery smoke test |

Settings persist `locale: zh | en | fr`. Missing locale in version-1 profiles defaults to Chinese. Renderers translate **only source literals and static template parts**. Runtime interpolation and stored user text are never passed through a DOM translation sweep. The static DOM localizer captures application-owned text nodes before data rendering. Use the same pattern for new UI; add both English and French catalog entries. Dates use locale-aware Intl formatting.

The main process validates sender/window URLs and actions. Renderer network connections are blocked by CSP; no direct Node access. AI endpoints accept only loopback HTTP with no credentials, path, query or fragment. Requests reject redirects, enforce timeouts and response/image limits. Run a local AUTOMATIC1111-compatible server with `--api` and an appropriately licensed model; inspect extensions for external forwarding. Real inference remains unverified.

`pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm test:i18n`. E2E uses `PIXELSTELLA_TEST=1` with a unique `PIXELSTELLA_DATA_DIR`; `PIXELSTELLA_PORTABLE` optionally points at a packaged executable. These settings must not be used for real profiles. Tests use synthetic plans/images and retain evidence in ignored `test-results/`.

`pnpm package:portable` creates a new `release/PixelStella-v0.2.0-win-x64/`, never overwriting. `node scripts/prepare-source.mjs <new-output-directory>` exports a whitelisted, hash-verified source set and checks known credential patterns. It refuses an existing destination. This is a preparation tool, not a complete secret scanner; review before publishing. Neither command pushes to GitHub. The project MIT license is shipped separately from Electron's own license.

Normal data is `%APPDATA%\PixelStella`. If its save is absent, legacy `%APPDATA%\Xingban` state and referenced image are copied with exclusive creation. Invalid saves/conflicting assets stop migration. Never delete old profiles to fix a migration automatically. Corrupt new saves block writes and remain intact. No data encryption or cross-device sync.

Manual acceptance still includes OS notification delivery, actual drag behavior, display scaling, a separate clean Windows machine, and real model/GPU tests. See [verification report](VERIFICATION.md).
