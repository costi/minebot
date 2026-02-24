module.exports = function greetPlayersSkill(bot, ctx) {
  const greeted = new Map()
  const MIN_COOLDOWN_MS = 3 * 60_000
  const MAX_COOLDOWN_MS = 7 * 60_000
  const GREET_NEAR_DISTANCE = 6
  const RESET_DISTANCE = 5
  const WAVE_COUNT = 2
  const WAVE_INTERVAL_MS = 300

  function randomCooldownMs() {
    return (
      MIN_COOLDOWN_MS +
      Math.floor(Math.random() * (MAX_COOLDOWN_MS - MIN_COOLDOWN_MS + 1))
    )
  }

  function shouldGreet(username, isNear) {
    const last = greeted.get(username)
    if (!last) return isNear
    if (!isNear) return false
    if (last.canGreet) return true
    return Date.now() - last.at > last.cooldownMs
  }

  function updateDistanceState(username, distance) {
    const last = greeted.get(username)
    if (!last) return
    if (distance > RESET_DISTANCE) last.canGreet = true
  }

  ctx.on(bot, 'entitySpawn', (entity) => {
    if (!entity || entity.type !== 'player') return
    if (entity === bot.entity) return
    const name = entity.username || entity.name
    if (!name) return
    if (!shouldGreet(name, true)) return
    greeted.set(name, {
      at: Date.now(),
      cooldownMs: randomCooldownMs(),
      canGreet: false,
    })
    bot.chat(`hello, ${name}!`)
    for (let i = 0; i < WAVE_COUNT; i++) {
      ctx.setTimeout(() => bot.swingArm('right', true), i * WAVE_INTERVAL_MS)
    }
  })

  ctx.setInterval(() => {
    if (!bot.entity) return
    for (const [name, player] of Object.entries(bot.players || {})) {
      if (!player || !player.entity) continue
      if (player.entity === bot.entity) continue
      const distance = player.entity.position.distanceTo(bot.entity.position)
      updateDistanceState(name, distance)
      const isNear = distance <= GREET_NEAR_DISTANCE
      if (shouldGreet(name, isNear)) {
        greeted.set(name, {
          at: Date.now(),
          cooldownMs: randomCooldownMs(),
          canGreet: false,
        })
        bot.chat(`hello, ${name}!`)
        for (let i = 0; i < WAVE_COUNT; i++) {
          ctx.setTimeout(() => bot.swingArm('right', true), i * WAVE_INTERVAL_MS)
        }
      }
    }
  }, 1000)
}
