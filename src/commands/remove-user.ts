import {Message, TextChannel} from 'discord.js'
import {datastore} from 'nedb-promise'


export async function removeUser(message: Message) {
  const channel = message.channel
  const command = message.content.split(" ")
  if (message.author.bot || channel.id !== process.env.SETTING_CHANNEL_ID || command.shift() !== "/remove") {
    return
  }
  const mentionUsers = message.mentions.users
  if (command.length == 0 && mentionUsers.size != 0 || command.length == 1 && mentionUsers.size != 1) {
    channel.send('コマンド間違っとるで')
  }

  let discordId = message.author.id
  if (message.mentions.users.size > 0) {
    discordId = message.mentions.users.first().id
  }
  const db = datastore({
    filename: '/db/users.db',
    autoload: true,
  })
  const data = await db.findOne({discordId: discordId})
  db.remove({discordId: discordId})
  if (data.chatId) {
    const mes: Message = await (<TextChannel>message.guild.channels.get(process.env.CHANNEL_ID)).fetchMessage(data.chatId)
    mes.delete()
  }

  channel.send(`<@${discordId}> 登録を消したで`)
}