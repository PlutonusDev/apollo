module.exports = {
	name: "Infractions",
	commands: ["infractions"],
	rateLimit: 30,
	categories: ["utility"],
	run: async (context, bot) => {
		const user = context.message.mentions.members.first() || await bot.client.users.fetch(context.args[0]);
		if(!user) return context.send("User not provided.");
		const infractions = await bot.db.getUserInfractions(user.id);
		return context.send({embeds:[{
			title: `${user.displayName}'s Infractions`,
			description: infractions[0] ? infractions.map(i => `${i.type} - ${i.data.comment}\nEXP: ${i.data.expiry}\nID: ${i.id}`).join("\n\n") : "No infractions found!"
		}]});
		return context.send(`\`\`\`js\n${JSON.stringify(infractions)}\n\`\`\``);
	}
}
