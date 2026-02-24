module.exports = function lifecycleSkill(bot, ctx) {
  const { username, logSensor } = ctx

  ctx.on(bot, 'login', () => {
    console.log(`[${username}] Logged in`)
    logSensor(username, 'Logged In', 'true')
  })

  ctx.on(bot, 'spawn', () => {
    console.log(`[${username}] Spawned at ${bot.entity.position}`)
    logSensor(username, 'Spawned', bot.entity.position.toString())
  })

  ctx.on(bot, 'kicked', (reason) => {
    console.error(`[${username}] Kicked: ${reason}`)
    logSensor(username, 'Kicked', reason)
  })

  ctx.on(bot, 'error', (err) => {
    console.error(`[${username}] Error: ${err.message}`)
    logSensor(username, 'Error', err.message)
  })

  ctx.on(bot, 'end', (reason) => {
    console.log(`[${username}] Disconnected: ${reason}`)
    logSensor(username, 'Disconnected', reason)
  })
}
