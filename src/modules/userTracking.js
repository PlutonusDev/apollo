module.exports = {
	name: "User Data Aggregation",
	init: bot => {
		bot.client.on("guildMemberAdd", async (member) => {
			const user = await bot.db.getUserById(member.id);
			if(user && user.revokedConsent) {
				await member.send({embeds:[{
					title: ":no_entry: Sorry!",
					description: "You have previously revoked consent for us to store your information, and consent is required to join this server.\n\nTo give consent again, join our Support Server and open a ticket.\n\n(discord invite here soon:tm:)"
				}]}).catch(()=>null);
				return member.kick("Consent Revoked");
			}

			if(!user) {
				await bot.db.createUser(member.id);
				return member.send({embeds:[{
					title: ":wave: Hello!",
					description: "I don't think we've met before.\n\nMy name is Apollo, and I'm a server security and moderation assistant in \`${member.guild.name}\` and many other servers. I use advanced convolutional neural networks to detect unwanted content.\n\nTo do this, we require the storage of information you may send. If you do not consent to this, join our Support Server and open a ticket.\n\n(server invite here soon:tm:)",
					footer: {
						text: `From: ${member.guild.name}`
					}
				}]});
			} else return member.send({embeds:[{
				title: ":wave: Hi, again!",
				description: `This is a courtesy message to let you know that I'm operating in \`${member.guild.name}\`.`,
				footer: {
					text: `From: ${member.guild.name}`
				}
			}]});
		});

		bot.client.on("messageCreate", async (msg) => {
			if(msg.author.bot) return;
			const user = await bot.db.getUserById(msg.author.id);
			if(!user) return bot.db.createUser(msg.author.id);
		});
	}
}
