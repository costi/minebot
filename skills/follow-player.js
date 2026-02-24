const { Movements, goals } = require('mineflayer-pathfinder')

module.exports = function followPlayerSkill(bot, ctx) {
  const { username, logSensor, formatVec } = ctx
  const DEFAULT_FOLLOW_DISTANCE = 2
  const FOLLOW_COMMAND = '!follow'
  const STOP_COMMAND = '!stop'
  const CHAT_MIN_MS = 3 * 60_000
  const CHAT_MAX_MS = 7 * 60_000
  const FOLLOW_REFRESH_MS = 1000
  const HEARTBEAT_MS = 3000
  const HAPPY_DISTANCE = 2.2
  const HAPPY_COOLDOWN_MS = 5000
  const HAPPY_JUMPS = 3
  const MOVE_LOG_THRESHOLD = 0.25
  const PHRASES = [
    'Following you like a loyal shadow.',
    'Your footsteps are my favorite soundtrack.',
    'I am your tiny, blocky bodyguard.',
    'Lead on, oh great architect.',
    'I am totally not a creeper.',
    'If we get lost, I blame you.',
    'I walk so you can craft.',
    'Please rate my pathfinding skills.',
    'I see you; therefore I follow.',
    'Adventure mode: enabled.',
    'If you stop, I stop. Mostly.',
    'I am 90% curiosity, 10% code.',
    'This is my cardio for the day.',
    'Behold, the art of trailing.',
    'I promise I will not push you.',
    'My map says: follow the human.',
    'I am your pixelated sidekick.',
    'Do you hear that? It is destiny.',
    'I am just here for the journey.',
    'Squad goals: you and me.',
  ]
  const FOLLOW_DISTANCE = Number.isFinite(ctx.config.followDistance)
    ? ctx.config.followDistance
    : DEFAULT_FOLLOW_DISTANCE

  let currentTarget = null
  let movementsReady = false
  let chatInterval = null
  let followInterval = null
  let heartbeatInterval = null
  let lastTargetPos = null
  let lastHappyAt = 0

  function ensureMovements() {
    if (movementsReady) return
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    bot.pathfinder.setMovements(movements)
    movementsReady = true
  }

  function findPlayerEntity(name) {
    const entry = bot.players ? bot.players[name] : null
    return entry && entry.entity ? entry.entity : null
  }

  function stopFollow(reason) {
    if (!currentTarget) return
    bot.pathfinder.setGoal(null)
    logSensor(username, 'Follow', `stopped (${reason})`)
    if (chatInterval) {
      clearTimeout(chatInterval)
      chatInterval = null
    }
    if (followInterval) {
      clearInterval(followInterval)
      followInterval = null
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    currentTarget = null
    lastTargetPos = null
  }

  function doHappyJump() {
    bot.setControlState('jump', true)
    ctx.setTimeout(() => bot.setControlState('jump', false), 150)
  }

  function celebrateNearTarget() {
    const now = Date.now()
    if (now - lastHappyAt < HAPPY_COOLDOWN_MS) return
    lastHappyAt = now
    bot.swingArm('right', true)
    for (let i = 0; i < HAPPY_JUMPS; i++) {
      ctx.setTimeout(() => doHappyJump(), i * 300)
    }
  }

  function startFollow(entity, name) {
    ensureMovements()
    currentTarget = name
    bot.pathfinder.setGoal(new goals.GoalFollow(entity, FOLLOW_DISTANCE), true)
    logSensor(username, 'Follow', `target ${name}`)
    lastTargetPos = entity.position ? entity.position.clone() : null
    function scheduleWhisper() {
      if (!currentTarget) return
      const delay =
        CHAT_MIN_MS +
        Math.floor(Math.random() * (CHAT_MAX_MS - CHAT_MIN_MS + 1))
      chatInterval = ctx.setTimeout(() => {
        if (!currentTarget) return
        const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
        bot.whisper(currentTarget, phrase)
        scheduleWhisper()
      }, delay)
    }
    if (chatInterval) clearTimeout(chatInterval)
    scheduleWhisper()
    if (followInterval) clearInterval(followInterval)
    followInterval = ctx.setInterval(() => {
      if (!currentTarget) return
      const currentEntity = findPlayerEntity(currentTarget)
      if (!currentEntity) {
        logSensor(username, 'Follow', `lost target ${currentTarget}`)
        stopFollow('lost target')
        return
      }
      if (currentEntity.position) {
        if (!lastTargetPos) {
          lastTargetPos = currentEntity.position.clone()
        } else if (
          currentEntity.position.distanceTo(lastTargetPos) > MOVE_LOG_THRESHOLD
        ) {
          lastTargetPos = currentEntity.position.clone()
          logSensor(
            username,
            'Follow',
            `target moved ${currentTarget} -> ${formatVec(
              currentEntity.position
            )}`
          )
        }
      } else {
        lastTargetPos = null
      }
      if (
        currentEntity.position &&
        currentEntity.position.distanceTo(bot.entity.position) <= HAPPY_DISTANCE
      ) {
        celebrateNearTarget()
      }
      bot.pathfinder.setGoal(
        new goals.GoalFollow(currentEntity, FOLLOW_DISTANCE),
        true
      )
    }, FOLLOW_REFRESH_MS)

    if (heartbeatInterval) clearInterval(heartbeatInterval)
    heartbeatInterval = ctx.setInterval(() => {
      if (!currentTarget) return
      const currentEntity = findPlayerEntity(currentTarget)
      const targetPos = currentEntity && currentEntity.position
        ? formatVec(currentEntity.position)
        : 'unknown'
      const selfPos = bot.entity && bot.entity.position
        ? formatVec(bot.entity.position)
        : 'unknown'
      logSensor(
        username,
        'Follow',
        `heartbeat ${currentTarget} target ${targetPos} self ${selfPos}`
      )
    }, HEARTBEAT_MS)
  }

  ctx.on(bot, 'whisper', (speaker, message) => {
    if (!speaker || !message) return
    const trimmed = message.trim()
    if (trimmed === STOP_COMMAND) {
      stopFollow('whisper')
      bot.whisper(speaker, 'ok, stopped')
      return
    }
    if (!trimmed.startsWith(FOLLOW_COMMAND)) return
    if (bot.survivalMode) {
      bot.whisper(speaker, 'cannot follow, survival mode')
      return
    }
    const parts = trimmed.split(/\s+/)
    const targetName = parts[1] || speaker
    const entity = findPlayerEntity(targetName)
    if (!entity) {
      bot.whisper(speaker, `cannot see ${targetName}`)
      return
    }
    startFollow(entity, targetName)
    bot.whisper(speaker, `following ${targetName}`)
  })

  ctx.on(bot, 'health', () => {
    if (bot.survivalMode) stopFollow('low health')
  })

  ctx.on(bot, 'death', () => {
    stopFollow('death')
  })

  ctx.on(bot, 'spawn', () => {
    stopFollow('respawn')
  })

  ctx.on(bot, 'end', () => {
    currentTarget = null
  })
}
