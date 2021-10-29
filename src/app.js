const config = require("config"),

	EventEmitter	= require("events"),
	Sentry		= require("@sentry/node"),
	Tracing		= require("@sentry/tracing"),

	path		= require("path"),
	os		= require("os"),
	dateFormat	= require("dateformat"),
	_		= require("colors"),
	chalk		= require("chalk"),
	caller_id	= require("caller-id"),
	express		= require("express");

// Init
let bot = {};

function configureSentry() {
	bot.logger = {
		log: (info, caller, error) => {
			if(!caller) caller = caller_id.getData();
			let file = caller.filePath ? caller.filePath.split(path.sep) : ["Nowhere"];
			let origin = `[${file[file.length-1]}${caller.functionName ? `/${caller.functionName}` : "/main"}] `.bold;
			let shard = bot.util ? bot.util.shard : "??";
			if(shard<10) shard = `0${shard}`;

			let out = info;
			const baseOut = info.message && info.message.guild && info.message.author ? `[${info.message.guild?.name || "DM"}] (${info.message.guild?.id || info.message.author.id}) #${info.message.channel?.name || "DM"} (${info.message.channel?.id}) ${info.message.author.username} (${info.message.author.id})` : ``;
			if(typeof info === "object" && info.type) {
				switch(info.type) {
					case "messageSend":
						if(info.message) out = `${baseOut} -> " ${info.message.content} "`;
						break;
					case "commandPerformed":
						if(info.message) out = `${baseOut} ran command ${chalk.blue(info.command.name)}: " ${info.message.content} "`;
						if(info.interaction) out = `[${info.interaction.guild?.name || "DM"}] (${info.interaction.guild?.id || info.interaction.user?.id}) #${info.interaction.channel?.name || "DM"} (${message.interaction.channel?.id}) ${info.interaction.user.username} (${info.interaction.user.id}) (INTERACTION) ran command ${chalk.blue(info.command.name)} -> " ${info.command.content} "`
						break;
				}
			}
			console[error ? "error" : "log"](`\t[${shard}] [${dateFormat(new Date(), "dd/mm/yy hh:MM")}]`, origin, out);
		}
	}

	bot.logger.error = (info) => {
		if(info) {
			if(typeof info === "object") info.level = "error";
			else info = { type: "text", message: info, level: "error" };
			bot.logger.log(info, caller_id.getData(), true);
		}
	}

	bot.logger.warn = (info) => {
		if(info) {
			if(typeof info === "object") info.level = "warn";
			else info = { type: "text", message: info, level: "warn" };
			bot.logger.log(info, caller_id.getData());
		}
	}

	bot.logger.info = (info) => {
		if(info) {
			if(typeof info === "object") info.level = "info";
			else info = { type: "text", message: info, level: "info" };
			bot.logger.log(info, caller_id.getData());
		}
	}

	bot.version = `Apollo V${require("../package.json").version}`;

	bot.api = express();
	bot.webApi = express();
	Sentry.init({
		captureUnhandledRejections: true,
		autoBreadcrumbs: true,
		dsn: config.get("Sentry.DSN"),
		serverName: `${os.hostname()}-APOLLO-base`,
		release: `apollo@${require("../package.json").version}`,
		integrations: [
			new Tracing.Integrations.Express({
				app: bot.api
			}),
			new Tracing.Integrations.Express({
				app: bot.webApi
			})
		],
		tracesSampleRate: 1.0,
		attachStackTrace: true
	});

	Sentry.setContext("apollo", {
		host: "arlo.gg",
		bot: config.get("Discord.id"),
		version: require("../package.json").version
	});

	bot.api.use(Sentry.Handlers.requestHandler());
	bot.api.use(Sentry.Handlers.tracingHandler());

	init();
}

function init() {
	process.setMaxListeners(100);
	bot.bus = new EventEmitter();
	loadModules().then(() => {
		bot.logger.log("Modules loaded!");
		bot.bus.emit("modulesLoaded");
	});
}

async function loadModules() {
	bot.logger.log("Loading modules...");
	const moduleFiles = config.get("Modules");
	const modulePath = config.get("General.ModulePath");

	for(let i = 0; i < moduleFiles.length; i++) {
		const fileName = moduleFiles[i];

		try {
			let loadedModule = require(`.${modulePath}/${fileName}.js`);
			if(loadedModule instanceof Function) {
				bot.logger.log(`Class-style module ${loadedModule.name} detected`);
				loadedModule = new loadedModule(bot);
			} else if(!loadedModule.name || !loadedModule.init) {
				bot.logger.warn(`${filename} is invalid! Missing 'name' and/or 'init'`);
				continue;
			}

			Sentry.configureScope(function initModule(scope) {
				scope.addBreadcrumb({
					category: "modules",
					message: "Loading module.",
					level: Sentry.Severity.Info,
					data: {
						name: loadedModule.name,
						path: modulePath,
						file: fileName,
						moduleFiles: moduleFiles
					}
				});
			});

			if(loadedModule.async) await loadedModule.init(bot);
			else loadedModule.init(bot);
			bot.logger.log(`Loaded module ${loadedModule.name} successfully`);
		} catch(e) {
			bot.logger.error(`Error loading module ${fileName}:`);
			console.error(e);
		}
	}
}

process.on("unhandledRejection", error => {
	console.error(error);
	Sentry.captureException(error);
});

configureSentry();
