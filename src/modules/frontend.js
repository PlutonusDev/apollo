const express = require("express");
const next = require("next");

module.exports = {
	name: "Frontend",
	init: bot => {
		const port = 8080;
		const app = next({ dev: true });

		app.prepare().then(() => {
			const server = express();

			server.all("*", (req, res) => app.getRequestHandler()(req, res));
			server.listen(port, () => bot.logger.log(`Running on port ${port}`));
		});
	}
}
