import vrc from 'vrchat-client'
import {datastore} from 'nedb-promise'
import {Client, Message, RichEmbed, TextChannel} from 'discord.js'
import VrcApi from 'vrchat-client/dist/vrc-api'
import {UserResponse} from 'vrchat-client/dist/types/user'


async function fetchStatus(api: VrcApi): Promise<{user: UserResponse, chatId: string, _id: string}[]> {
  const db = datastore({
    filename: '/db/users.db',
    autoload: true,
  })

  const users: {vrchatId: string, chatId: string, _id: string}[] = await db.find({})
  return await Promise.all(users.map(async v => {return {user: await api.user.getById(v.vrchatId), chatId: v.chatId, _id: v._id}}))
}

async function createEmbed(userObj: {user: UserResponse, chatId: string, _id: string}, api: VrcApi): Promise<{embed: RichEmbed, chatId: string, _id: string}> {
  const user = userObj.user
  const embed = new RichEmbed()
    .setAuthor(user.displayName, user.currentAvatarThumbnailImageUrl, `https://vrchat.net/home/user/${user.id}`)
  if (user.location === 'offline') {
    embed.setDescription(`Status: Offline`)
  } else {
    let instanceTag = 'public'
    if (user.worldId === 'private') {
      embed.setDescription(`Status: Private`)
    } else {
      const worldInfo = await api.world.getById(user.worldId)
      const instance = user.instanceId.split('~')
      if (instance.length === 3) {
        switch (instance[1].substring(0, instance[1].indexOf('('))) {
          case 'hidden':
            instanceTag = 'friends+'
            break
          case 'friends':
            instanceTag = 'friends'
            break
        }
      }
      embed.setDescription(`Status: ${user.status}/${user.statusDescription}`)
        .setTitle(`${worldInfo.name} - ${instanceTag}`)
        .setThumbnail(worldInfo.imageUrl)
        .setColor(0x00ff40)
    }
  }
  return {embed: embed, chatId: userObj.chatId, _id: userObj._id}
}

async function sendStatusMessage(api: VrcApi, channel: TextChannel) {
  const users = await fetchStatus(api)
  const embeds = await Promise.all(users.map(v => createEmbed(v, api)))
  embeds.map(async v => {
    if (v.chatId) {
      const mes = await channel.fetchMessage(v.chatId)
      mes.edit(v.embed)
    } else {
      const mes = await channel.send(v.embed)
      if (mes instanceof Message) {
        const db = datastore({
          filename: '/db/users.db',
          autoload: true,
        })
        db.update({_id: v._id}, {$set: {chatId: mes.id}})
      }
    }
  })
}


async function registerUser(message: Message, api: VrcApi) {
  const channel = message.channel
  const command = message.content.split(" ")
  if (message.author.bot || channel.id !== process.env.SETTING_CHANNEL_ID || command.shift() !== "/register") {
    return
  }
  const mentionUsers = message.mentions.users
  if (command.length == 1 && mentionUsers.size != 0 || command.length == 2 && mentionUsers.size != 1) {
    channel.send('コマンド間違っとるで')
  }

  let discordId = message.author.id
  if (message.mentions.users.size > 0) {
    discordId = message.mentions.users.first().id
    command.shift()
  }

  const vrc = command.shift()
  let user: UserResponse = null
  try {
    user = await api.user.getById(vrc)
  } catch (e) {
    try {
      user = await api.user.getByName(vrc)
    } catch (e) {
      channel.send('名前でもIDでもないっぽいぞ')
    }
  }

  const db = datastore({
    filename: '/db/users.db',
    autoload: true,
  })
  const checkId = await db.count({discordId: discordId})
  if (checkId > 0) {
    channel.send("なんかもう登録されてるで｡消すときは`/remove [mention]`してな｡")
    return
  }
  db.insert({vrchatId: user.id, discordId: discordId})
  let data = await db.find({})
  data = data.filter(v => v.chatId)
  db.update({}, {$unset: {chatId: true}}, {multi: true})
  data.forEach(async v => {
    const mes = await (<TextChannel>message.guild.channels.get(process.env.CHANNEL_ID)).fetchMessage(v.chatId)
    mes.delete()
  })
  channel.send(`<@${discordId}> VRChat: ${user.username} (${user.id})を登録したぞ`)
}

async function removeUser(message: Message) {
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
  const mes: Message = await (<TextChannel>message.guild.channels.get(process.env.CHANNEL_ID)).fetchMessage(data.chatId)
  mes.delete()

  channel.send(`<@${discordId}> 登録を消したで`)
}

(async () => {
  const client = new Client()
  await client.login(process.env.TOKEN)
  const channel = (<TextChannel>client.channels.get(process.env.CHANNEL_ID))
  const api = await vrc.login(process.env.VRC_USERNAME, process.env.VRC_PASSWORD)
  setInterval(() => {
    sendStatusMessage(api, channel)
  }, Number(process.env.CYCLE) * 1000)

  client.on('message', message => registerUser(message, api))
  client.on('message', removeUser)
})()

