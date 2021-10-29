module.exports = {
	name: "Statistics Aggregator",
	init: async bot => {
		bot.stats = {
			__INFO__: "All information displayed here is session-exclusive, and resets to 0 on bot restart. Ratelimit stats, reconnects, and XPerMinute stats all get updated or set to 0 every 60 seconds.",
			messagesPerMinute: 0,
			messagesTotal: 0,
			messagesSentPerMinute: 0,
			messagesSentTotal: 0,
			commandsPerMinute: 0,
			commandsTotal: 0,
			warnings: 0,
			errors: 0,
			botRateLimits: 0,
			userRateLimits: 0,
			reconnects: 0,
			lastUpdate: 0,
			commandsFailed: 0,
			cacheHits: 0,
			cacheMisses: 0,
			tasksCompleted: 0,
			infractionsGiven: 0
		}

		let currentStats = {
			messagesPerMinute: 0,
			messagesSentPerMinute: 0,
			commandsPerMinute: 0
		}

		bot.client.on("messageCreate", () => {
			currentStats.messagesPerMinute++;
			bot.stats.messagesTotal++;
		});

		bot.client.on("commandPerformed", () => {
			currentStats.commandsPerMinute++;
			bot.stats.commandsTotal++;
		});

		bot.bus.on("messageSent", () => {
			currentStats.messagesSentPerMinute++;
			bot.stats.messagesSentTotal++;
		});

		bot.bus.on("commandFailed", () => bot.stats.commandsFailed++);
		bot.client.on("rateLimit", () => bot.stats.botRateLimits++);
		bot.client.on("error", () => bot.stats.errors++);
		bot.client.on("shardError", () => bot.stats.errors++);
		bot.client.on("warn", () => bot.stats.warnings++);
		bot.client.on("shardReconnecting", () => bot.stats.reconnects++);

		setInterval(() => {
			bot.stats.messagesPerMinute = currentStats.messagesPerMinute;
			bot.stats.commandsPerMinute = currentStats.commandsPerMinute;
			bot.stats.messagesSentPerMinute = currentStats.messagesSentPerMinute;
			bot.stats.botRateLimits = 0;
			bot.stats.warnings = 0;
			bot.stats.errors = 0;
			bot.stats.reconnects = 0;
			bot.stats.lastUpdate = new Date().getTime();
			currentStats.messagesPerMinute = 0;
			currentStats.commandsPerMinute = 0;
			currentStats.messagesSentPerMinute = 0;
		}, 60000);

		bot.api.get("/stats", (req, res) => {
			res.json(bot.stats);
		});
	}
}
