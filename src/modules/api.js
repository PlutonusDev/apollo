const os = require("os");
const config = require("config");

module.exports = {
	name: "HTTP API",
	init: async bot => {
		bot.api.use((req, res, next) => {
			res.setHeader("X-Shard", bot.util.shard);
			next();
		});

		bot.api.get("/", (req, res) => {
			res.json({
				shard: bot.util.shard,
				totalShards: process.env.SHARD_COUNT,
				drain: bot.drain,
				version: require("../../package.json").version
			});
		});

		const port = parseInt(config.get("API.port"));
		bot.api.listen(port, () => bot.logger.log(`Listening on port ${port}`));
	}
}
