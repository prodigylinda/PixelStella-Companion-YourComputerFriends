# Confidentialité et données locales PixelStella

Sans compte, statistiques, télémétrie ni synchronisation cloud. Les processus d'interface n'accèdent pas directement à Node.js, aux fichiers, au shell, à la caméra ou au réseau arbitraire ; les opérations nécessaires passent par une interface IPC restreinte.

Dossier : `%APPDATA%\PixelStella`. L'ancienne sauvegarde `%APPDATA%\Xingban` et l'image référencée ne sont copiées qu'en l'absence de nouvelle sauvegarde. Les anciens fichiers restent intacts. Des données anciennes invalides bloquent la migration. Les nouvelles sauvegardes existantes ne sont jamais remplacées.

- `state.json` : apparence, nom, tâches, langue, préférences, minuteur et jusqu'à 500 rappels. **Non chiffré** ; accessible aux personnes partageant le même compte Windows.
- `assets/*.png` : images décodées et redimensionnées localement. Les fichiers d'origine ne sont pas modifiés. Changer de personnage ne supprime pas les anciennes images.
- L'historique garde les titres et dates des rappels, sans prouver leur réception Windows. Supprimer une tâche n'efface pas cet historique.
- Les avatars et JSON exportés restent jusqu'à leur suppression manuelle. Les exports contiennent les notes : vérifiez-les avant partage.
- Le Centre de notifications Windows peut conserver les titres hors du dossier de données. Le mode silencieux désactive les notifications système, mais garde les rappels internes.

Seules les actions explicites de test ou de création IA contactent le service de boucle locale configuré. Le test demande les modèles ; la création envoie la description et des paramètres fixes, sans tâches, historique ni photos. Pas de conversion photo vers chibi. Les journaux et extensions du service tiers ne sont pas contrôlés par cette application.

Le changement de langue ne traduit que les textes de l'application. Les données utilisateur sont préservées. Une sauvegarde illisible bloque l'écriture ; un échec d'enregistrement est signalé sans faux message de réussite. Quittez et sauvegardez les données avant réparation. Electron peut créer ses caches et diagnostics habituels dans le dossier utilisateur ; l'application ne journalise pas volontairement les tâches ou descriptions. Elle ne supprime pas à distance les fichiers locaux ou copies du système.
