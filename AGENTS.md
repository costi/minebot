# Agents

- Reload skills after making changes: send `!reload` in chat or `kill -USR1 <pid>`.
- Find the bot process: `pgrep -af "node bot.js"`.
- Background run: `npm run start:bg` (logs to `bot.log`, PID in `bot.pid`).
- Stop background run: `npm run stop:bg`.
- Hard restart: `npm run restart:bg`.
- Logs: `npm run logs:bg`.
- Auto-reload on skill changes: `npm run watch:skills`.
- Reload skills: `npm run reload:bg`.
- Skills should define their own defaults; don’t rely on new `CONFIG` fields in `bot.js`.
- Why: skills are hot‑reloadable; adding new `CONFIG` keys requires a full restart, so defaults in skills keep changes hot‑loadable.
- Whisper commands: `!follow [player]`, `!stop` (follows unless in survival mode).
- Use `ctx.setInterval`/`ctx.setTimeout` in skills so timers are cleaned up on reload.
