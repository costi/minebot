# minebot

A small experimental Minecraft bot project. The long‑term idea is to let a Minecraft bot “attempt to gain sentience” by having an LLM write/modify its Mineflayer behaviors, then periodically self‑review and iterate. Today, this repo is a minimal multi‑bot Mineflayer harness you can run locally.

## What it does today
- Spawns multiple Mineflayer bots with staggered connections.
- Logs lifecycle events (connect, spawn, kicked, error, disconnect).
- Makes each bot jump once per second after spawning.

## Project idea (planned)
The intended loop is:
1. An LLM proposes or writes Mineflayer behaviors.
2. The bot runs those behaviors in‑game.
3. A periodic “check‑in” prompts the LLM to review outcomes and adjust the code.

That LLM loop is **not implemented yet** in this repo; this README documents the concept so it’s clear where the project is heading.

## Requirements
- Node.js (current LTS recommended)
- A Minecraft server you can connect to

## Setup
```bash
npm install
```

## Run
```bash
npm start
```

### Background run
```bash
npm run start:bg
tail -f bot.log
```

Stop it:
```bash
npm run stop:bg
```

Hard restart:
```bash
npm run restart:bg
```

Logs:
```bash
npm run logs:bg
```

Reload skills (sends SIGUSR1):
```bash
npm run reload:bg
```

### Auto-reload skills on save
```bash
npm run watch:skills
```

## Configuration
Edit these constants in `bot.js`:
- `BOT_COUNT`: number of bots to spawn
- `HOST`: server host
- `PORT`: server port
- `VERSION`: Minecraft protocol version (must match your server)
- `CONFIG.sensorIntervalMs`: sensor output interval
- `CONFIG.adminUsers`: usernames allowed to run chat commands
- `CONFIG.allowAllReload`: allow any user to run the reload command
- `CONFIG.reloadCommand`: chat command string for reload

## Notes
- The bots use `auth: 'offline'`. If you connect to an online‑mode server, you will need to implement proper authentication.
- If you change the server version, update `VERSION` accordingly.

## Roadmap ideas
- Add a “code‑generation” layer that calls an LLM to write Mineflayer behaviors.
- Add a periodic supervisor that evaluates behavior and suggests changes.
- Sandboxed execution and safety checks for LLM‑generated code.

## Skills
Skills live in `skills/` and are auto‑loaded at startup. Each file exports a function:

- `(bot, ctx) => { /* wire events, behavior, sensors */ }`

The context includes:
- `ctx.username`: bot name
- `ctx.logSensor(label, value)`: logging helper
- `ctx.formatVec(vec)`: coordinate formatter
- `ctx.config`: shared configuration (e.g. `sensorIntervalMs`)
- `ctx.on(emitter, event, handler)`: tracked event listener
- `ctx.setInterval(fn, ms)`: tracked interval

## Reloading skills
You can reload all skills without disconnecting:
- Send `!reload` in chat (allowed by `CONFIG.adminUsers` or `CONFIG.allowAllReload`).
- Send `SIGUSR1` or `SIGUSR2` to the Node process.

Note: changes to `bot.js` still require a full process restart. Skill changes do not.

## License
MIT (add a LICENSE file if you want to make this explicit).
