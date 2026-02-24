const HEALTH_LOW = 6
const FOOD_LOW = 6

function updateSurvival(bot, username, logSensor) {
  const shouldBeCautious = bot.health <= HEALTH_LOW || bot.food <= FOOD_LOW
  if (shouldBeCautious && !bot.survivalMode) {
    bot.survivalMode = true
    logSensor(
      username,
      'Goal',
      `stay alive -> cautious (health ${bot.health}, food ${bot.food})`
    )
    bot.setControlState('jump', false)
  } else if (!shouldBeCautious && bot.survivalMode) {
    bot.survivalMode = false
    logSensor(username, 'Goal', 'stay alive -> normal')
  }
}

module.exports = function goalSurvivalSkill(bot, ctx) {
  const { username, logSensor } = ctx

  ctx.on(bot, 'spawn', () => {
    bot.survivalMode = false
    updateSurvival(bot, username, logSensor)
  })

  ctx.on(bot, 'health', () => {
    updateSurvival(bot, username, logSensor)
  })

  ctx.on(bot, 'hurt', () => {
    updateSurvival(bot, username, logSensor)
  })
}
