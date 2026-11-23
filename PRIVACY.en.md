# PixelStella privacy and local data

No account, analytics, telemetry or cloud sync. Renderer processes have no direct Node.js, filesystem, shell, camera or arbitrary network access; restricted main-process IPC handles necessary operations.

Data folder: `%APPDATA%\PixelStella`. Legacy `%APPDATA%\Xingban` saves and their referenced image are copied only if no new save exists; old files remain untouched. Invalid legacy data stops migration. Existing new saves are never replaced.

- `state.json`: character appearance and name, plans, language and preferences, timer state and up to 500 reminder records. **Not encrypted**; people sharing the Windows account may access it.
- `assets/*.png`: locally decoded and resized imported/generated images. Original input files are not modified. Switching characters does not automatically remove old images.
- Reminder records retain plan titles and timestamps. They do not prove Windows notification delivery. Deleting a plan does not erase these records.
- Exported avatars and plan JSON remain until you delete them yourself. Plan exports contain notes: inspect before sharing.
- Windows Notification Center may retain titles outside this save folder. Quiet mode disables system notifications but keeps in-app reminders.

Only explicit AI checks/generation access the configured loopback service. A check retrieves a model list; generation sends the prompt and fixed parameters, not plans, history or photos. Photo-to-chibi conversion is not implemented. The app cannot control a third-party image server's logs or extensions.

Language changes translate application copy only, preserving user content. Unreadable saves are retained and writes blocked. Storage failures are reported, never shown as successful saves. Quit and back up your data folder before attempting repairs. Electron may create normal runtime caches and diagnostic files in its user-data folder; this application does not intentionally log your plans or prompts. Local files and OS copies are not remotely deleted.
