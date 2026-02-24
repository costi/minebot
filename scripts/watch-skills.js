const fs = require('fs')
const path = require('path')

const SKILLS_DIR = path.join(__dirname, '..', 'skills')
const PID_FILE = path.join(__dirname, '..', 'bot.pid')
const RELOAD_SIGNAL = 'SIGUSR1'
const DEBOUNCE_MS = 300

let debounceTimer = null

function readPid() {
  if (!fs.existsSync(PID_FILE)) return null
  const content = fs.readFileSync(PID_FILE, 'utf8').trim()
  const pid = Number.parseInt(content, 10)
  return Number.isNaN(pid) ? null : pid
}

function triggerReload() {
  const pid = readPid()
  if (!pid) {
    console.log('[watch] No bot.pid found; start with npm run start:bg')
    return
  }
  try {
    process.kill(pid, RELOAD_SIGNAL)
    console.log(`[watch] Sent ${RELOAD_SIGNAL} to ${pid}`)
  } catch (err) {
    console.error(`[watch] Failed to signal ${pid}: ${err.message || err}`)
  }
}

function scheduleReload() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    triggerReload()
  }, DEBOUNCE_MS)
}

if (!fs.existsSync(SKILLS_DIR)) {
  console.error(`[watch] Missing skills directory: ${SKILLS_DIR}`)
  process.exit(1)
}

fs.watch(SKILLS_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename || !filename.endsWith('.js')) return
  console.log(`[watch] ${eventType}: ${filename}`)
  scheduleReload()
})

console.log(`[watch] Watching ${SKILLS_DIR} for changes...`)
