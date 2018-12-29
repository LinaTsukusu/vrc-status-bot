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
    const worldInfo = await api.world.getById(user.worldId)
    console.log(worldInfo)
    const instance = user.instanceId.split('~')
    let instanceTag = 'public'
    if (instance.length === 3) {
      switch (instance[1].substring(0, instance[1].indexOf('('))) {
        case 'hidden':
          instanceTag = 'friends+'
          break
        case 'friends':
          instanceTag = 'friends'
          break
        case 'private':
          instanceTag = 'private'
          break
      }
    }
    embed.setDescription(`Status: ${user.status}/${user.statusDescription}`)
      .setTitle(`${worldInfo.name} - ${instanceTag}`)
      .setThumbnail(worldInfo.imageUrl)
  }
  return {embed: embed, chatId: userObj.chatId, _id: userObj._id}
}

async function sendStatusMessage(api: VrcApi, channel: TextChannel) {
  const users = await fetchStatus(api)
  console.log(users)
  const embeds = await Promise.all(users.map(v => createEmbed(v, api)))
  console.log(embeds)
  Promise.all(embeds.map(async v => {
    if (v.chatId) {
      const mes: Message = await channel.fetchMessage(v.chatId)
      mes.edit(v.embed)
    } else {
      const mes = await channel.send(v.embed)
      if (mes instanceof Message) {
        const db = datastore({
          filename: '/db/users.db',
          autoload: true,
        })
        db.update({_id: v._id}, {chatId: mes.id})
      }
    }
  }))
}

(async () => {
  const client = new Client()
  await client.login(process.env.TOKEN)
  const channel = (<TextChannel>client.channels.get(process.env.CHANNEL_ID))
  const api = await vrc.login(process.env.VRC_USERNAME, process.env.VRC_PASSWORD)
  setInterval(() => {
    sendStatusMessage(api, channel)
  }, 5000)
})()

