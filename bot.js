const mineflayer = require('mineflayer')

const BOT_COUNT = 5
const HOST = 'lianli.local'
const PORT = 25565
const VERSION = '1.21.10'

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

  bot.on('login', () => {
    console.log(`[${username}] Logged in`)
  })

  bot.on('spawn', () => {
    console.log(`[${username}] Spawned at ${bot.entity.position}`)
    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 100)
    }, 1000)
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
