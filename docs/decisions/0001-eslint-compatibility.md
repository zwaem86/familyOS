# ADR 0001: ESLint 9 für die kompatible Next.js-Lint-Werkzeugkette

Datum: 15. November 2026. Status: angenommen für Phase 1.

## Kontext

Die Spezifikation verlangt aktuelle, stabile und zueinander kompatible Versionen. Next.js 16.4.6 akzeptiert ESLint >=9, seine eingebundenen Plugins `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2 und `eslint-plugin-react` 7.37.5 deklarieren jedoch noch keine ESLint-10-Kompatibilität. Ein Versuch mit ESLint 10.15.0 bestand Lint, erzeugte aber Peer-Konflikte bei `npm ci --dry-run`.

## Entscheidung

ESLint wird auf 9.39.5 fixiert, die neueste kompatible 9er-Version der verfügbaren Werkzeugkette. Keine erzwungenen Peer-Overrides. Dies priorisiert die geforderte Kompatibilität gegenüber der neuesten ESLint-Major-Version. ESLint 9 meldet bereits sein Supportende; das bleibt eine bekannte Einschränkung ausschließlich der Entwicklungswerkzeuge.

## Folgen

Lint bleibt reproduzierbar mit den von Next.js verwendeten Plugins. Upgrade auf ESLint 10 sobald alle eingebundenen Plugins es unterstützen. Sieben moderate npm-Audit-Meldungen im TypeScript-Lint-Abhängigkeitsbaum (minimatch-Advisory GHSA-g3hv-75wg-m249) bleiben offen; `npm audit fix` behebt sie aktuell nicht innerhalb der deklarierten Major-Versionen. Kein erzwungener Major-Override einer transitiven Bibliothek ohne Kompatibilitätsnachweis. Produktive Abhängigkeiten sind separat zu prüfen.
