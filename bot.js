const fs = require('fs')
const path = require('path')
const mineflayer = require('mineflayer')

const DEFAULT_BOT_COUNT = 1
const HOST = 'lianli.local'
const PORT = 25565
const VERSION = '1.21.10'
const BOT_COUNT_FLAG = '--bots'
const HELP_FLAGS = new Set(['--help', '-h'])

const CONFIG = {
  sensorIntervalMs: 2000,
  adminUsers: [],
  allowAllReload: true,
  reloadCommand: '!reload',
}

function showHelp() {
  console.log('Usage: node bot.js [--bots N]')
  console.log('')
  console.log('Options:')
  console.log('  --bots N   Number of bots to spawn (1-20). Default: 1')
  console.log('  -h, --help Show this help message')
}

if (process.argv.some((arg) => HELP_FLAGS.has(arg))) {
  showHelp()
  process.exit(0)
}

const botsFlagIndex = process.argv.indexOf(BOT_COUNT_FLAG)
const MIN_BOT_COUNT = 1
const MAX_BOT_COUNT = 20

function clampBotCount(value) {
  if (Number.isNaN(value)) {
    console.warn(
      `[config] BOT_COUNT is not a number; using ${DEFAULT_BOT_COUNT}`
    )
    return DEFAULT_BOT_COUNT
  }
  if (value < MIN_BOT_COUNT) {
    console.warn(
      `[config] BOT_COUNT ${value} is too low; using ${MIN_BOT_COUNT}`
    )
    return MIN_BOT_COUNT
  }
  if (value > MAX_BOT_COUNT) {
    console.warn(
      `[config] BOT_COUNT ${value} is too high; using ${MAX_BOT_COUNT}`
    )
    return MAX_BOT_COUNT
  }
  return value
}

const BOT_COUNT_RAW =
  botsFlagIndex !== -1 && process.argv[botsFlagIndex + 1]
    ? Number.parseInt(process.argv[botsFlagIndex + 1], 10)
    : DEFAULT_BOT_COUNT
const BOT_COUNT = clampBotCount(BOT_COUNT_RAW)

function formatVec(vec) {
  return `${vec.x.toFixed(1)}, ${vec.y.toFixed(1)}, ${vec.z.toFixed(1)}`
}

function logSensor(username, label, value) {
  console.log(`[${username}] ${label}: ${value}`)
}

function createSkillRuntime(bot, ctxBase) {
  const listeners = []
  const intervals = []
  const disposers = []

  function on(emitter, event, handler) {
    emitter.on(event, handler)
    listeners.push({ emitter, event, handler })
  }

  function setIntervalTracked(fn, ms) {
    const id = setInterval(fn, ms)
    intervals.push(id)
    return id
  }

  function addDisposer(fn) {
    if (typeof fn === 'function') disposers.push(fn)
  }

  function disposeAll() {
    for (const { emitter, event, handler } of listeners) {
      emitter.removeListener(event, handler)
    }
    listeners.length = 0

    for (const id of intervals) {
      clearInterval(id)
    }
    intervals.length = 0

    for (const dispose of disposers) {
      dispose()
    }
    disposers.length = 0
  }

  return {
    on,
    setInterval: setIntervalTracked,
    addDisposer,
    disposeAll,
    ctx: {
      ...ctxBase,
      on,
      setInterval: setIntervalTracked,
      addDisposer,
    },
  }
}

function loadSkills(bot, ctxBase) {
  const skillsDir = path.join(__dirname, 'skills')
  if (!fs.existsSync(skillsDir)) return { reload: () => {} }

  let runtime = createSkillRuntime(bot, ctxBase)

  function loadAllSkills(targetRuntime) {
    const skillFiles = fs
      .readdirSync(skillsDir)
      .filter((file) => file.endsWith('.js'))
      .sort()

    for (const file of skillFiles) {
      const skillPath = path.join(skillsDir, file)
      delete require.cache[require.resolve(skillPath)]
      const skill = require(skillPath)
      if (typeof skill === 'function') {
        const disposer = skill(bot, targetRuntime.ctx)
        targetRuntime.addDisposer(disposer)
      }
    }
  }

  function reload() {
    const nextRuntime = createSkillRuntime(bot, ctxBase)
    try {
      loadAllSkills(nextRuntime)
    } catch (err) {
      console.error(
        `[${ctxBase.username}] Skill reload failed: ${err.message || err}`
      )
      nextRuntime.disposeAll()
      return false
    }
    runtime.disposeAll()
    runtime = nextRuntime
    return true
  }

  reload()
  return { reload }
}

function createBot(index) {
  const username = `minebot${index}`
  console.log(`[${username}] Connecting...`)

  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username,
    auth: 'offline',
    version: VERSION,
  })

  const ctx = {
    username,
    logSensor,
    formatVec,
    config: CONFIG,
  }

  const skills = loadSkills(bot, ctx)

  bot.on('chat', (speaker, message) => {
    if (speaker === username) return
    const isAllowed =
      CONFIG.allowAllReload || CONFIG.adminUsers.includes(speaker)
    if (!isAllowed) return
    if (message.trim() === CONFIG.reloadCommand) {
      console.log(`[${username}] Reloading skills (requested by ${speaker})`)
      skills.reload()
    }
  })

  process.on('SIGUSR1', () => {
    console.log(`[${username}] Reloading skills (SIGUSR1)`)
    skills.reload()
  })

  process.on('SIGUSR2', () => {
    console.log(`[${username}] Reloading skills (SIGUSR2)`)
    skills.reload()
  })

  bot.on('kicked', (reason) => {
    console.error(`[${username}] Kicked: ${reason}`)
  })

  bot.on('error', (err) => {
    console.error(`[${username}] Error: ${err.message}`)
  })

  bot.on('end', (reason) => {
    console.log(`[${username}] Disconnected: ${reason}`)
  })
}

for (let i = 1; i <= BOT_COUNT; i++) {
  // Stagger connections slightly to avoid flooding the server
  setTimeout(() => createBot(i), (i - 1) * 500)
}
