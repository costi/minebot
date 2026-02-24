# Agents

- Reload skills after making changes: send `!reload` in chat or `kill -USR1 <pid>`.
- Find the bot process: `pgrep -af "node bot.js"`.
- Background run: `npm run start:bg` (logs to `bot.log`, PID in `bot.pid`).
- Stop background run: `npm run stop:bg`.
- Hard restart: `npm run restart:bg`.
- Logs: `npm run logs:bg`.
- Auto-reload on skill changes: `npm run watch:skills`.
- Reload skills: `npm run reload:bg`.
