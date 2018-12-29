import vrc from 'vrchat-client'
import {datastore} from 'nedb-promise'
import {Client, Message, RichEmbed, TextChannel} from 'discord.js'
import VrcApi from 'vrchat-client/dist/vrc-api'
import {UserResponse} from 'vrchat-client/dist/types/user'


async function fetchStatus(api: VrcApi): Promise<UserResponse[]> {
  const db = datastore({
    filename: '/db/users.db',
    autoload: true,
  })

  const userIds: {vrchatId: string}[] = await db.find({}, {"vrchatId": true})
  return await Promise.all(userIds.map(v => api.user.getById(v.vrchatId)))
}

async function createEmbed(user: UserResponse, api: VrcApi): Promise<RichEmbed> {
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
  return embed
}

async function sendStatusMessage(api: VrcApi, channel: TextChannel): Promise<(Message | Message[])[]> {
  const users = await fetchStatus(api)
  const embeds = await Promise.all(users.map(v => createEmbed(v, api)))
  return await Promise.all(embeds.map(v => channel.send(v)))
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

