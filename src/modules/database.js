const Mongoose = require("mongoose");
const { UniqueID } = require("nodejs-snowflake");
const config = require("config");

module.exports = {
	name: "MongoDB Integration",
	init: bot => {
		bot.db = {};
		bot.db.connection = Mongoose.connection;

		bot.db.schemas = require("../util/database").schemas;
		bot.db.models = require("../util/database").models;

		Mongoose.connect(config.get("MongoDB.host"), {
			useNewUrlParser: true,
			useUnifiedTopology: true
		}).then(() => {
			bot.db.refs = {
				users: bot.db.connection.db.collection("users"),
				infractions: bot.db.connection.db.collection("infractions")
			}

			bot.logger.log("Database connected successfully");
		});

		bot.db.getUserById = id => {
			return new Promise(async res => {
				const user = await bot.db.refs.users.findOne({ id });
				return res(user || null);
			});
		}

		bot.db.createUser = id => {
			bot.tasks.startTask("DBCreateUser", id);
			return new Promise(res => {
				const user = new bot.db.models.User({ id, revokedConsent: false });
				user.save(err => {
					bot.logger.log(`User "${bot.client.users.cache.get(id).tag}" (${id}) added to db`);
					bot.tasks.endTask("DBCreateUser", id);
					if(err) return res(false);
					return res(user);
				});
			});
		}

		bot.db.getUserInfractions = id => {
			return new Promise(async res => {
				const infractions = await bot.db.models.Infraction.find({ user: id });
				res(infractions);
			});
		}

		bot.db.createInfraction = data => {
			const snowflake = new UniqueID().getUniqueID();
			if(!data.type) return;
			if(!data.user || !data.guild) return;
			bot.tasks.startTask("DBCreateInfraction", snowflake);
			return new Promise(res => {
				const infraction = new bot.db.models.Infraction({
					user: data.user.id,
					id: snowflake,
					type: data.type,
					data: {
						expiry: data.expiry || "Never",
						server: data.guild.id,
						comment: data.comment || "No reason specified."
					}
				});
				infraction.save(err => {
					bot.logger.log(`Infraction (ID ${snowflake}) recorded for user ${data.user.tag} (${data.user.id})`);
					bot.tasks.endTask("DBCreateInfraction", snowflake);
					if(err) return res(false);
					return res(infraction);
				});
			});
		}
	}
}
