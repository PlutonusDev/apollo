const config = require("config");
const Sentry = require("@sentry/node");
const Discord = require("discord.js");

module.exports = {
	name: "Discord.JS Integration",
	init: bot => {
		const oldEdit = Discord.Message.prototype.edit;
		Discord.Message.prototype.edit = async (content, options) => {
			Sentry.addBreadcrumb({
				message: "Editing Message",
				data: { content, options }
			});
			bot.bus.emit("messageSent", content);

			let editedMessage = await oldEdit.apply(this, [content, options]);
			bot.logger.log({type: "messageEdited", message: bot.util.serializeMessage(editedMessage)});
			return editedMessage;
		}

		const oldSend = Discord.Message.prototype.send;
		Discord.Message.prototype.send = async (content, options) => {
			Sentry.addBreadcrumb({
				message: "Sending Message",
				data: { content, options: JSON.stringify(options) }
			});

			try {
				Sentry.setExtra("caller", caller_id.getData());
			} catch(e) {}

			bot.bus.emit("messageSent", content);

			let sentMessage = await oldSend.apply(this, [content, options]);
			bot.logger.log({type: "messageSend", message: bot.util.serializeMessage(sentMessage)});
			bot.client.login();
		}


		// Start
		const clientOpts = {
			allowedMentions: {
				parse: ["users"],
				repliedUser: true
			},
			messageCacheLifetime: 3600,
			invalidRequestWarningInterval: 500,
			retryLimit: 3,
			presence: {
				activity: {
					name: "Windows XP Startup Tune",
					type: "LISTENING"
				}
			},
			partials: ["REACTION", "CHANNEL"],
			intents: [
				"GUILDS",
				"GUILD_MESSAGES",
				"GUILD_MEMBERS",
				"DIRECT_MESSAGES"
			]
		}

		bot.client = new Discord.Client(clientOpts);

		bot.client.bot = bot; // :hehe:
		bot.client.setMaxListeners(100);

		bot.client.on("ready", () => {
			Sentry.configureScope(scope => {
				bot.logger.log(`Logged in as ${bot.client.user.tag}`);
				scope.addBreadcrumb({
					message: "Ready",
					level: Sentry.Severity.Info,
					category: "discord"
				});
			});
		});

		bot.client.on("disconnect", event => {
			Sentry.getCurrentHub().addBreadcrumb({
				message: "Disconnected",
				level: Sentry.Severity.Warning,
				category: "discord",
				data: event
			});
			bot.logger.warn("Disconnected")
		});

		bot.client.on("error", event => {
			bot.logger.log("Websocket Error");
			bot.logger.log(event);
			Sentry.captureException(event.error);
		});

		bot.client.on("warn", event => {
			bot.logger.warn(event);
			Sentry.getCurrentHub().addBreadcrumb({
				message: "Warn",
				level: Sentry.Severity.Warning,
				category: "discord",
				data: {
					warning: event
				}
			});
		});

		bot.api.get("/discord", (req, res) => {
			const shard = bot.client.ws.shards.first();
			res.json({
				readyAt: bot.client.readyAt,
				uptime: bot.client.uptime,
				guilds: bot.client.guilds.cache.size,
				users: bot.client.users.cache.size,
				channels: bot.client.channels.cache.size,
				unavailable: bot.client.guilds.cache.filter(g => !g.available).size,
				ws: {
					shard: {
						ping: shard.ping,
						status: shard.status
					},
					sessionStartLimit: bot.client.ws.sessionStartLimit,
					reconnecting: bot.client.ws.reconnecting,
					destroyed: bot.client.ws.destroyed
				}
			});
		});

		bot.api.get("/user/:id", async (req, res) => {
			try {
				return res.json(await bot.client.users.fetch(req.params.id));
			} catch(err) {
				return res.json({err});
			}
		});

		bot.api.get("/guild/:id", async (req, res) => {
			try {
				return res.json(bot.util.serializeGuild(await bot.client.guilds.fetch(req.params.id)));
			} catch(err) {
				return res.json({err});
			}
		});

		bot.client.login(config.get("Discord.token"));
	}
}
