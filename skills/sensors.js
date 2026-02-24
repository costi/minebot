module.exports = function sensorsSkill(bot, ctx) {
  const { username, logSensor, formatVec, config } = ctx
  const last = {}
  const debugTarget =
    typeof config.nearbyDebugTarget === 'string'
      ? config.nearbyDebugTarget
      : ''

  function logIfChanged(key, value, formatter = (val) => val) {
    const formatted = formatter(value)
    if (last[key] === formatted) return
    last[key] = formatted
    logSensor(username, key, formatted)
  }

  function startSensors() {
    if (!bot.entity) return
    logIfChanged('Health', bot.health)
    logIfChanged('Food', bot.food)
    logIfChanged('Position', bot.entity.position, formatVec)

    ctx.setInterval(() => {
      if (!bot.entity) return
      const nearbyRange = Number.isFinite(config.nearbyRange)
        ? config.nearbyRange
        : 8
      const block = bot.blockAt(bot.entity.position.offset(0, -1, 0))
      const nearbyPlayers = Object.values(bot.players || {})
        .map((player) => player && player.entity)
        .filter((entity) => entity && entity !== bot.entity)
        .filter(
          (entity) =>
            entity.position &&
            entity.position.distanceTo(bot.entity.position) <= nearbyRange
        )
        .map((entity) => {
          const name = entity.username || entity.name || 'unknown'
          const pos = entity.position ? formatVec(entity.position) : 'unknown'
          return `player:${name}:${entity.id}@${pos}`
        })

      const nearbyEntities = Object.values(bot.entities)
        .filter((entity) => entity && entity !== bot.entity)
        .filter(
          (entity) =>
            entity.position &&
            entity.position.distanceTo(bot.entity.position) <= nearbyRange
        )
        .map((entity) => {
          const name = entity.username || entity.name || 'unknown'
          const pos = entity.position ? formatVec(entity.position) : 'unknown'
          return `${entity.type}:${name}:${entity.id}@${pos}`
        })

      const nearby = [...new Set([...nearbyPlayers, ...nearbyEntities])].sort()
      if (debugTarget) {
        const playerEntry = bot.players ? bot.players[debugTarget] : undefined
        const hasPlayer = Boolean(playerEntry)
        const hasEntity = Boolean(playerEntry && playerEntry.entity)
        logIfChanged('Players Known', Object.keys(bot.players || {}).length)
        logIfChanged('Entities Known', Object.keys(bot.entities || {}).length)
        logIfChanged(
          `Player Seen:${debugTarget}`,
          `${hasPlayer}/${hasEntity}`
        )
      }
      logIfChanged('Position', bot.entity.position, formatVec)
      logIfChanged('Velocity', bot.entity.velocity, formatVec)
      logIfChanged('Health', bot.health)
      logIfChanged('Food', bot.food)
      logIfChanged('On Block', block ? block.name : 'unknown')
      logIfChanged(
        'Nearby Entities',
        nearby.length ? nearby.join(', ') : 'none'
      )
      logIfChanged('Inventory Items', bot.inventory.items().length)
    }, config.sensorIntervalMs)

    ctx.setInterval(() => {
      const stamp = new Date().toISOString()
      logSensor(
        username,
        'Vitals',
        `${stamp} health ${bot.health} food ${bot.food}`
      )
    }, 20000)
  }

  ctx.on(bot, 'spawn', () => {
    startSensors()
  })

  startSensors()

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
    const nearestPos =
      nearest && nearest.position ? formatVec(nearest.position) : 'unknown'
    const nearestInfo = `${nearestType}:${nearestName}:${nearestId}@${nearestPos}`
    const selfPos = formatVec(bot.entity.position)
    logSensor(
      username,
      'Entity Hurt',
      `at ${selfPos} suspect nearest ${nearestInfo}`
    )
  })

  ctx.on(bot, 'entityDead', (entity) => {
    if (entity === bot.entity) {
      logSensor(username, 'Died', `at ${formatVec(bot.entity.position)}`)
    }
  })
}
