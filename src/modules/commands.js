const Sentry = require("@sentry/node");
const fs = require("fs");

const { MessageCommandContext } = require("../util/CommandContext");
const { crc32 } = require("crc");

module.exports = class CommandsHandler {
	bot;
	commandMiddleware = {};
	middlewareOrder = [];

	name = "Commands Registry";

	constructor(bot) {
		this.bot = bot;
		bot.command = this;
	}

	init() {
		this.bot.commandObjects = {};
		this.bot.commandUsages = {};
		this.bot.slashCategories = {};
		this.bot.commands = {};
		this.bot.prefixCache = {};

		process.on("exit", async code => {
			this.bot.logger.log(`Process close requested, code ${code}`);
			this.bot.drain = true;
			for(let command in this.bot.commandObjects) {
				if(this.bot.commandObjects.hasOwnProperty(command) && this.bot.commandObjects[command].shutdown) {
					this.bot.logger.log(`Shutting down command "${command}"`);
					await this.bot.commandObjects[command].shutdown(this.bot);
				}
			}
		});

		this.bot.client.on("ready", this.onDiscordReady.bind(this));
		this.bot.client.on("messageCreate", this.onMessageCreate.bind(this));
		this.bot.client.on("messageUpdate", this.onMessageUpdate.bind(this));
		//this.bot.client.on("interactionCreate", this.onSlashCommandInteraction.bind(this));
		//this.bot.client.on("interactionCreate", this.onContextInteraction.bind(this));

		this.bot.runCommand = this.runCommand.bind(this);
		//this.bot.addCommandMiddleware = this.addCommandMiddleware.bind(this);

		this.loadCommands();
	}

	async onDiscordReady() {
		// TODO
	}

	async onMessageCreate(message) {
		if(this.bot.drain || message.author.bot) return;
		const parse = this.parseCommand(message);
		if(!parse) return;
		const context = this.initContext(new MessageCommandContext(this.bot, message, parse.args, parse.command));
		if(!context) return;
		//if(context.getBool("disableMessageCommands")) return;
		return this.runCommand(context);
	}

	async onMessageUpdate(oldMessage, newMessage) {
		return;
		/*if(this.bot.drain || newMessage.author.bot) return;
		if(oldMessage.content == newMessage.content) return;
		if(oldMessage.response?.deleted) return this.bot.logger.log("Edited message response was deleted");
		const parse = this.parseCommand(newMessage);
		if(!parse) return;
		const context = this.initContext(new MessageEditCommandContext(this.bot, newMessage, oldMessage.response, parse.args, parse.command));
		if(!context) return;
		if(context.getBool("disabledMessageCommands")) return;
		return this.runCommand(context);*/
	}


	// HELPER
	parseCommand(message) {
		const prefix = "a;"; // TODO: message.getSetting("prefix");
		if(!prefix) return null; // Bot hasn't fully loaded
		const prefixLength = prefix.length;
		if(!message.content.startsWith(prefix)) return null;
		const args = message.content.split(/\s+/g);
		const command = args[0].substring(prefixLength).toLowerCase();
		if(!this.bot.commandUsages[command]) return null;
		return { args, command }
	}

	initContext(context) {
		context.commandData = this.bot.commandUsages[context.command];
		/*if(context.commandData?.pattern) {
			const parsedInput = commandParser.Parse(context.args.slice(1).join(" "), { pattern: context.commandData.pattern, id: context.command });
			if(parsedInput.error) context.error = parsedInput.error;
			else context.options = parsedInput.data;
		}*/
		return context;
	}

	loadCommands() {
		fs.readdir(`${__dirname}/../commands`, (err, files) => {
			if(err) {
				this.bot.logger.error("Error reading from commands directory");
				console.error(err);
				Sentry.captureException(err);
			} else {
				let promises = [];
				for(const command of files) {
					if(!fs.lstatSync(`${__dirname}/../commands/${command}`).isDirectory()) {
						promises.push(this.loadCommand(command));
					}
				}
				Promise.all(promises).then(() => {
					this.bot.bus.emit("commandLoadFinished");
					this.bot.logger.log("Finished loading commands");
				});
			}
		});
	}

	async loadCommand(command, reload) {
		try {
			const module = `${__dirname}/../commands/${command}`;
			if(reload) delete require.cache[require.resolve(module)];
			let crc = crc32(fs.readFileSync(module, "utf8")).toString(16);
			let loadedCommand = require(module);
			if(loadedCommand.init && !reload) {
				try {
					loadedCommand.init(this.bot);
				} catch(e) {
					Sentry.captureException(e);
					this.bot.logger.error(e);
				}
			} else if(loadedCommand.init) {
				this.bot.logger.warn(`Command ${command} was reloaded, but init() was not run.`);
			}
			this.bot.logger.log(`Loaded command ${loadedCommand.name} ${`(${crc})`.gray}`);

			if(reload) {
				if(this.bot.commandUsages[loadedCommand.commands[0]]) {
					let oldCrc = this.bot.commandUsages[loadedCommand.commands[0]].crc;
					if(oldCrc !== crc) this.bot.logger.log(`Command ${command} version has changed from ${oldCrc} to ${crc}`);
					else this.bot.logger.warn(`Command ${command} was reloaded but remains the same version`);
				}
			}

			if(loadedCommand.nestedDir) loadedCommand = await this.loadSubcommands(loadedCommand);
			//loadedCommand.pattern = commandParser.BuildPattern(command, loadedCommand.usage).pattern;
			//if(!loadedCommand.slashHiden) loadedCommand.slashOptions = Util.PatternToOptions(loadedCommand.pattern, loadedCommand.argDescriptions);

			this.bot.commandObjects[command] = loadedCommand;

			for(let i in loadedCommand.commands) {
				if(loadedCommand.commands.hasOwnProperty(i)) {
					const commandName = loadedCommand.commands[i];
					this.bot.commands[commandName] = this.bot.commandObjects[command].run;
					this.bot.commandUsages[commandName] = {
						id: command,
						crc,
						...loadedCommand
					}
				}
			}
		} catch(e) {
			console.error(e);
			this.bot.logger.error("Failed to load command");
			this.bot.logger.error(e);
			Sentry.captureException(e);
		}
	}

	loadSubcommands(loadedCommand, path = "commands") {
		return new Promise(res => {
			this.bot.logger.log(`Loading nested commands for ${loadedCommand.name}`);
			fs.readdir(`${__dirname}/../${path}/${loadedCommand.nestedDir}`, async (err, files) => {
				if(err) {
					Sentry.captureException(err);
					this.bot.logger.warn(`Unable to load ${loadedCommand.name} nested command dir ${loadedCommand.nestedDir}, ${err}`);
					return;
				}
				loadedCommand.subCommands = {};
				for(let i = 0; i < files.length; i++) {
					try {
						this.bot.logger.log(`Loading sub-command for ${loadedCommand.name}: ${loadedCommand.nestedDir}/${files[i]}`);
						const command = require(`../${path}/${loadedCommand.nestedDir}/${files[i]}`);
						if(command.init) {
							this.bot.logger.log(`Initialising ${loadedCommand.name}/${command.name}`);
							await command.init(this.bot, loadedCommand);
						}

						command.id = files[i];
						command.pattern = commandParser.BuildPattern(command.commands[0], command.usage).pattern;

						// TODO: Subcommands
						// Slash commands don't support nested commands yet
						loadedCommand.slashHidden = true;

						for(let i = 0; i < command.commands.length; i++) {
							loadedCommand.subCommands[command.commands[i]] = command;
						}
					} catch(e) {
						this.bot.logger.error(e);
						console.log(e);
						Sentry.captureException(e);
					}
				}
				if(loadedCommand.usage.indexOf("command") < 0) loadedCommand.usage += " :command?";
				res(loadedCommand);
			});
		});
	}

	async runCommand(context) {
		Sentry.configureScope(scope => {
			scope.setUser({
				username: context.user.username,
				id: context.user.id
			});
			scope.setTag("command", context.command);
		});

		const tx = Sentry.startTransaction({
			name: `Command ${context.command}`,
			sampled: true,
			data: {
				content: context.content,
				options: context.options
			}
		});

		try {
			if(!this.bot.commandUsages[context.command]) {
				if(!context.guild) return console.log("Command doesn't exist");
				context.logPerformed();
			}
			context.logPerformed();

			//if(!await this.runCommandMiddleware(context)) return console.log("Middleware triggered");
			//if(context.commandData.middleware && !await context.commandData.middleware(context, this.bot)) return console.log("Command specific middleware triggered");

			if(context.error) {
				if(context.commandData.handleError) {
					return context.commandData.handleError(context, this.bot);
				}
				return context.send("Error. TODO: parsed tracing and reply");
			}

			this.bot.bus.emit("commandPerformed", context);
			Sentry.addBreadcrumb({
				category: "Command",
				level: Sentry.Severity.Info,
				message: context.message,
				data: {
					username: context.user.username,
					id: context.user.id,
					message: context.message?.content,
					options: context.options,
					channel: context.channel?.id
				}
			});

			if(context.commandData.subCommands) {
				let parsedInput;
				let trueCommand = context.options.command?.toLowerCase();
				if(!trueCommand || (trueCommand !== "help" && !context.commandData.subCommands[trueCommand])) trueCommand = "help";

				if(context.commandData.subCommands[trueCommand]) {
					if(context.args) {
						parsedInput = commandParser.Parse(context.args.slice(2).join(" "), {
							pattern: context.commandData.subCommands[trueCommand].pattern,
							id: context.options.command
						});

						if(parsedInput.data) context.options = { ...parsedInput.data, ...context.options }
					}
					if(!parsedInput || !parsedInput.error) return await context.commandData.subCommands[trueCommand].run(context, this.bot);
				}
				if(!this.bot.commands[context.command] || (context.options.command === "help")) return await this.bot.commands["nestedCommandHelp"](context, this.bot);
			}

			return await this.bot.commands[context.command](context, this.bot);
		} catch(e) {
			console.log(e);
			let exceptionId = Sentry.captureException(e);
			if(context.channel?.permissionsFor?.(this.bot.client.user.id)?.has("EMBED_LINKS")) {
				context.reply({embeds: [{
					title: "An Error Occured",
					description: `Something went wrong whilst running your command, try again later.\n\nThe developers have been notified, but if you require additional support, quote this code:\n\`\`\`\n${exceptionId}\n\`\`\``
				}], ephemeral: true});
			} else {
				context.reply({content: `Something went wrong whilst running your command, try again later.\n\nThe developer have been notified, but if you require additional support, quote this code:\n\`\`\`\n${exceptionId}\n\`\`\``, ephemeral: true });
			}
			this.bot.bus.emit("commandFailed", e);
		} finally {
			if(tx) tx.finish();
		}
	}
}
