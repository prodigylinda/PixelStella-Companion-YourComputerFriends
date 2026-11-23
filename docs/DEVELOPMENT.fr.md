# Développement PixelStella

Windows / Node.js 24+ / pnpm 11. Installation et commandes dans le [README](../README.fr.md). L'installation Electron est explicite ; n'autorisez pas de scripts tiers sans rapport. Gardez le bac à sable Electron et l'isolation de contexte actifs.

| Dossier | Rôle |
|---|---|
| src/main | Cycle Electron, IPC validé, JSON atomique, copie de l'ancien profil, IA locale restreinte |
| src/shared | Modèles, validation, planification, SVG original et catalogue zh/en/fr |
| src/renderer | Panneau, compagnon, traduction du DOM statique, pont typé |
| scripts | Compilation, icône originale, paquet portable Windows, export propre des sources |
| tests | Tests unitaires, migration, parcours bureau, langues, accessibilité et livraison |

La préférence `locale: zh | en | fr` est persistée. Sans langue dans un ancien profil version 1, le chinois est choisi. Seuls les littéraux et segments statiques des modèles HTML sont traduits. Les interpolations et textes utilisateur restent intacts. Le traducteur du DOM capture les textes statiques avant tout affichage de données. Respectez ce modèle et ajoutez les traductions anglaises et françaises pour toute nouvelle interface. Les dates utilisent Intl.

Le processus principal vérifie les fenêtres, URL et actions IPC. La CSP bloque le réseau des interfaces, sans accès direct à Node.js. L'IA n'accepte que HTTP en boucle locale, sans identifiants, chemin, paramètres ou fragment ; redirections refusées, délais et tailles limités. Lancez un service compatible AUTOMATIC1111 avec `--api` et un modèle sous licence adaptée. Vérifiez les extensions et transferts externes. L'inférence réelle reste non validée.

Commandes : `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm test:i18n`. Les tests utilisent `PIXELSTELLA_TEST=1` et un `PIXELSTELLA_DATA_DIR` unique ; `PIXELSTELLA_PORTABLE` désigne facultativement un exécutable portable. Ne les appliquez pas aux profils réels. Les données synthétiques et preuves restent dans `test-results/`, ignoré par Git.

`pnpm package:portable` crée `release/PixelStella-v0.2.0-win-x64/` sans écrasement. `node scripts/prepare-source.mjs <nouveau-dossier>` exporte une liste autorisée, vérifie les empreintes et des motifs connus de secrets. Le dossier doit être nouveau. Ce contrôle ne remplace pas une revue de sécurité avant publication. Aucune commande ne pousse sur GitHub. La licence MIT du projet reste distincte de celle d'Electron.

Données normales : `%APPDATA%\PixelStella`. Sans sauvegarde nouvelle, le fichier d'état `%APPDATA%\Xingban` et son image référencée sont copiés par création exclusive. Des données invalides ou images en conflit bloquent la migration. Ne supprimez jamais automatiquement l'ancien profil. Une nouvelle sauvegarde corrompue reste conservée, avec écriture bloquée. Pas de chiffrement ni de synchronisation entre appareils.

Acceptation manuelle restante : réception des notifications Windows, glissement réel, mise à l'échelle, autre PC Windows vierge et modèle/GPU réel. Voir le [rapport](VERIFICATION.md).
