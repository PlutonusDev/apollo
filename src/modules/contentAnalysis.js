const Sentry = require("@sentry/node");
const config = require("config");
const { google } = require("googleapis");

const DISCOVERY_URL = "https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1";

module.exports = {
	name: "Message Contextual Analysis",
	init: async bot => {
		const provider = await google.discoverAPI(DISCOVERY_URL);

		const offenseMap = {
			TOXICITY: "Toxic Content",
			SEVERE_TOXICITY: "Severely Toxic Content",
			IDENTITY_ATTACK: "Attack/s on Identity",
			PROFANITY: "Profanity",
			INSULT: "Insult/s",
			THREAT: "Threat/s",
			FLIRTATION: "Flirting",
			SEXUALLY_EXPLICIT: "Sexually Explicit Content",
			SPAM: "Spam"
		}

		bot.client.on("messageCreate", msg => {
			if(msg.author.bot || !msg.content) return;
			provider.comments.analyze({
				key: config.get("Google.key"),
				resource: {
					comment: { text: msg.content },
					requestedAttributes: {
						TOXICITY: {},
						SEVERE_TOXICITY: {},
						IDENTITY_ATTACK: {},
						/*PROFANITY: {},*/
						INSULT: {},
						THREAT: {},
						FLIRTATION: {},
						SEXUALLY_EXPLICIT: {},
						SPAM: {}
					},
					doNotStore: true,
					languages: ["en"]
				}
			}, async (err, resp) => {
				if(err || !resp.data.attributeScores) return console.log(err || "No scores!");

				const scores = resp.data.attributeScores;
				const types = [];
				let bad = false;
				let output = Object.keys(scores).sort((a, b) => scores[b].summaryScore.value-scores[a].summaryScore.value).map(type => {
					const score = (scores[type].summaryScore.value*100).toFixed(2);
					let output = `\`${score}%\` **${offenseMap[type]}**`;
					if(score<95) return null;
					bad = true;
					types.push(offenseMap[type]);
					return output;
				});

				if(bad) {
					bot.stats.infractionsGiven++;
					const infraction = await bot.db.createInfraction({
						type: "Offensive Content",
						comment: `Message contains: ${types.join(", ")}.`,

						user: msg.author,
						guild: msg.guild || { id: msg.author.id }
					});
					return msg.reply({embeds:[{
						image: { url: "https://i.vgy.me/ApKQDN.png" },
						description: `[${infraction.type}](https://arlo.gg/infraction/${infraction.id})\n${infraction.data.comment}`,
						footer: { text: `Expires ${infraction.data.expiry} | ID ${infraction.id}`},
						color: 16543586
					}]});
				}
			});
		});
	}
}
