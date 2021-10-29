module.exports = {
	name: "Ping",
	commands: ["ping"],
	rateLimit: 30,
	categories: ["utility"],
	run: async (context, bot) => {
		return context.send(`API Latency is currently ${bot.client.ws.ping}ms.`);
	}
}
