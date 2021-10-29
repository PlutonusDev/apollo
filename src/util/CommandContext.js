const Sentry = require("@sentry/node");

class CommandContext {
	bot; id; member; user; channel; guild;
	content; command; commandData; error;
	options = {};

	constructor(bot, member, user, channel, guild, command, id) {
		this.bot = bot;
		this.member = member;
		this.user = user;
		this.channel = channel;
		this.guild = guild;
		this.command = command;
		this.id = id;
	}

	logPerformed() { console.log(this); }

	async getMember(id) {
		if(this.guild) return this.guild.members.fetch(id).catch(()=>null);
		if(this.channel?.members?.fetch) return this.channel.members.fetch(id).catch(()=>null);
		return this.channel?.members.get(id);
	}

	send(options) {
		throw new Error("This context does not support sending");
	}

	edit(options) {
		throw new Error("This context does not support editing");
	}

	reply(options) {
		throw new Error("This context does not support replying");
	}

	defer(options) {
		throw new Error("This context does not support deferring");
	}
}

class MessageCommandContext extends CommandContext {
	message; args;

	constructor(bot, message, args, command) {
		super(bot, message?.member, message?.author, message?.channel, message?.guild, command, message?.id);
		this.args = args;
		if(message) {
			this.message = message;
			this.content = message.content;
		}
	}

	logPerformed() {
		this.bot.logger.log({
			type: "commandPerformed",
			command: {
				name: this.command,
				id: this.command,
				content: this.message.content
			},
			message: this.bot.util.serializeMessage(this.message)
		});
	}

	async send(options) {
		if(!this.channel) return this.bot.logger.warn("Channel stopped existing? "+this.content);
		Sentry.addBreadcrumb({
			message: "Message Send",
			data: {
				command: this.command,
				id: this.message?.id,
				guild: this.message?.guild?.id,
				channel: this.message?.channel?.id
			}
		});
		Sentry.setExtra("context", { type: "message", command: this.command, args: this.args, message: this.message?.content });

		if(options.components) options.components = options.components.filter(c=>c);
		const message = await this.channel.send(options);
		if(this.message) this.message.response = message;
		this.bot.bus.emit("messageSent", message);
		return message;
	}

	async edit(options) {
		if(!this.channel) return this.bot.logger.warn("Channel stopped existing? "+this.content);
		Sentry.addBreadcrumb({
			message: "Message Edited",
			data: {
				command: this.command,
				id: this.id,
				guild: this.guild?.id,
				channel: this.channel?.id
			}
		});
		Sentry.addExtra("context", { type: "message", command: this.command, args: this.args, message: this.message?.content });

		if(!message || message.deleted) return this.send(options);
		return message.edit(options);
	}

	async reply(options) {
		Sentry.addBreadcrumb({
			message: "Message Replied",
			data: {
				command: this.command,
				id: this.id,
				guild: this.guild?.id,
				channel: this.channel?.id
			}
		});
		Sentry.setExtra("context", { type: "message", command: this.command, args: this.args, message: this.message?.content });

		if(!this.message || this.message.deleted  || this.channel.permissionsFor && !this.channel.permissionsFor(this.bot.client.user.id).has("READ_MESSAGE_HISTORY")) return this.send(options);
		const message = await this.message.reply(options);
		this.message.response = message;
		this.bot.bus.emit("messageSent", message);
		return message;
	}

	defer(options) {
		return this.message.channel.sendTyping();
	}
}

module.exports = {
	CommandContext,
	MessageCommandContext
}
