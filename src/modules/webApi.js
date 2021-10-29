const config = require("config");

module.exports = {
	name: "WebServices API",
	init: async bot => {
		bot.webApi.use((req, res, next) => {
			next();
		});

		bot.webApi.get("/", (req, res) => {
			res.json({
				message: "Hello, world!"
			});
		});

		const port = parseInt(config.get("WebAPI.port"));
		bot.webApi.listen(port, () => bot.logger.log(`Listening on port ${port}`));
	}
}
