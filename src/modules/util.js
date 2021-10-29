module.exports = {
	name: "Utilities",
	init: bot => {
		bot.util = {};

		bot.util.shard = "??";

		bot.util.permissionsMap = {
			ADMINISTRATOR: "Administrator",
			CREATE_INSTANT_INVITE: "Create Invites",
			KICK_MEMBERS: "Kick Members",
			BAN_MEMBERS: "Ban Members",
			MANAGE_CHANNELS: "Manage Channels",
			MANAGE_GUILD: "Manage Guild",
			ADD_REACTIONS: "Add Reactions",
			VIEW_AUDIT_LOG: "View Audit Logs",
			PRIORITY_SPEAKER: "Priority Speaker",
			VIEW_CHANNEL: "Read Messages",
			READ_MESSAGES: "Read Messages",
			SEND_MESSAGES: "Send Messages",
			SEND_TTS_MESSAGES: "Send TTS",
			MANAGE_MESSAGES: "Manage Messages",
			EMBED_LINKS: "Embed Links",
			ATTACH_FILES: "Attach Files",
			READ_MESSAGE_HISTORY: "Read Message History",
			MENTION_EVERYONE: "Mention Everyone",
			USE_EXTERNAL_EMOJIS: "Use External Emojis",
			CONNECT: "Connect to Voice Channels",
			SPEAK: "Speak in Voice Channels",
			MUTE_MEMBERS: "Mute Members in Voice Channels",
			DEAFEN_MEMBERS: "Deafen Members in Voice Channels",
			MOVE_MEMBERS: "Move Members in Voice Channels",
			USE_VAD: "Use Voice Activity",
			CHANGE_NICKNAME: "Change Nickname",
			MANAGE_NICKNAMES: "Manage Nicknames",
			MANAGE_ROLES_OR_PERMISSIONS: "Manage Roles",
			MANAGE_WEBHOOKS: "Manage Webhooks",
			MANAGE_EMOJIS: "Manage Emojis and Stickers",
			MANAGE_EMOJIS_AND_STICKERS: "Manage Emojis and Stickers"
		}

		const mainChannelRegex = /main|general|discussion|home|lobby/gi;
		const secondaryChannelRegex = /bot.*|spam|off-topic/gi;
		const requiredPermissions = [ "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "VIEW_CHANNEL" ];

		bot.util.determineMainChannel = guild => {
			let channels = guild.channels;
			let mainChannel = channels.cache.find(channel => channel.type === "text" && channel.name.match(mainChannelRegex) && channel.permissionsFor(bot.client.user).has(requiredPermissions, true));
			if(mainChannel) return mainChannel;

			let backupChannel = channels.cache.find(channel => channel.type === "text" && channel.name.match(secondaryChannelRegex) && channel.permissionsFor(bot.client.user).has(requiredPermissions, true));
			if(backupChannel) return backupChannel;

			return channels.cache.find(channel => channel.type === "text" && channel.permissionsFor(bot.client.user).has(requiredPermissions, true));
		}

		bot.util.serializeUser = user => {
			if(!user) return {};
			return {
				username: user.username,
				bot: user.bot,
				id: user.id,
				avatar: user.avatarURL({size: 128, format: "png"})
			}
		}

		bot.util.serializeMember = member => {
			if(!member) return {};
			return {
				username: member.user.username,
				bot: member.user.bot,
				id: member.id,
				avatar: member.user.avatarURL({size: 128, format: "png"}),
				nickname: member.nickname,
				colour: member.displayHexColor,
				roles: member.roles.cache.map(bot.util.serializeRole)
			}
		}

		bot.util.serializeRole = role => {
			if(!role) return {};
			return {
				name: role.name,
				id: role.id,
				hoist: role.hoist,
				colour: role.color,
				permissions: role.permissions
			}
		}

		bot.util.serializeChannel = channel => {
			if(!channel) return {};
			return {
				name: channel.name,
				id: channel.id,
				type: channel.type
			}
		}

		bot.util.serializeGuild = guild => {
			if(!guild) return {};
			return {
				name: guild.name,
				id: guild.id,
				icon: guild.iconURL(),
				owner: guild.ownerId
			}
		}

		bot.util.serializeMentions = mentions => {
			if(!mentions) return {};
			return {
				users: mentions.users.map(u => bot.util.serializeUser(u)),
				channels: mentions.channels.map(c => bot.util.serializeChannel(c)),
				everyone: mentions.everyone,
				crosspostedChannels: mentions.crosspostedChannels
			}
		}

		bot.util.serializeMessage = message => {
			if(!message) return {};
			return {
				guild: bot.util.serializeGuild(message.guild),
				channel: bot.util.serializeChannel(message.channel),
				author: message.member ? bot.util.serializeMember(message.member) : bot.util.serializeUser(message.author),
				content: message.content,
				reference: message.reference,
				id: message.id,
				timestamp: message.createdTimestamp,
				attachments: message.attachments?.map(a => a.url),
				embeds: message.embeds,
				mentions: bot.util.serializeMentions(message.mentions)
			}
		}

		bot.util.serializeInteraction = interaction => {
			if(!interaction) return {};
			return {
				guild: bot.util.serializeGuild(interaction.guild),
				channel: bot.util.serializeChannel(interaction.channel),
				author: interaction.member ? bot.util.serializeMember(interaction.member) : bot.util.serializeUser(interaction.user),
				id: interaction.id,
				type: interaction.type,
				timestamp: interaction.createdTimestamp
			}
		}
	}
}
