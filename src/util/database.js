const Mongoose = require("mongoose");

const schemas = {
	User: new Mongoose.Schema({
		id: String,
		revokedConsent: Boolean
	}),

	Infraction: new Mongoose.Schema({
		user: String,
		id: String,
		type: String,
		data: {
			expiry: String,
			server: String,
			comment: String,
		}
	})
}

const models = {
	User: Mongoose.model("User", schemas.User, "users"),
	Infraction: Mongoose.model("Infraction", schemas.Infraction, "infractions")
}

module.exports = { schemas, models };
