module.exports = function sensorsSkill(bot, ctx) {
  const { username, logSensor, formatVec, config } = ctx
  const last = {}

  function logIfChanged(key, value, formatter = (val) => val) {
    const formatted = formatter(value)
    if (last[key] === formatted) return
    last[key] = formatted
    logSensor(username, key, formatted)
  }

  ctx.on(bot, 'spawn', () => {
    logIfChanged('Health', bot.health)
    logIfChanged('Food', bot.food)
    logIfChanged('Position', bot.entity.position, formatVec)

    ctx.setInterval(() => {
      const block = bot.blockAt(bot.entity.position.offset(0, -1, 0))
      logIfChanged('Position', bot.entity.position, formatVec)
      logIfChanged('Velocity', bot.entity.velocity, formatVec)
      logIfChanged('Health', bot.health)
      logIfChanged('Food', bot.food)
      logIfChanged('On Block', block ? block.name : 'unknown')
      logIfChanged('Nearby Entities', bot.nearestEntity() ? 'yes' : 'none')
      logIfChanged('Inventory Items', bot.inventory.items().length)
    }, config.sensorIntervalMs)
  })

  ctx.on(bot, 'health', () => {
    logIfChanged('Health', bot.health)
    logIfChanged('Food', bot.food)
  })

  ctx.on(bot, 'hurt', () => {
    logSensor(username, 'Hurt', `health ${bot.health}`)
  })

  ctx.on(bot, 'entityHurt', (entity) => {
    if (entity !== bot.entity) return
    const nearest = bot.nearestEntity()
    const nearestId = nearest ? nearest.id : 'unknown'
    const nearestName =
      nearest && (nearest.username || nearest.name)
        ? nearest.username || nearest.name
        : 'unknown'
    const nearestType = nearest ? nearest.type : 'unknown'
    const nearestInfo = `${nearestType}:${nearestName}:${nearestId}`
    logSensor(
      username,
      'Entity Hurt',
      `suspect nearest ${nearestInfo}`
    )
  })

  ctx.on(bot, 'entityDead', (entity) => {
    if (entity === bot.entity) {
      logSensor(username, 'Died', 'true')
    }
  })
}
