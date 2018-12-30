import {UserResponse} from 'vrchat-client/dist/types/user'
import VrcApi from 'vrchat-client/dist/vrc-api'
import {RichEmbed} from "discord.js"

export async function createEmbed(userObj: {user: UserResponse, chatId: string, _id: string}, api: VrcApi): Promise<{embed: RichEmbed, chatId: string, _id: string}> {
  const user = userObj.user
  const embed = new RichEmbed()
    .setAuthor(user.displayName, user.currentAvatarThumbnailImageUrl, `https://vrchat.net/home/user/${user.id}`)
  if (user.location === 'offline') {
    embed.setDescription(`Status: Offline`)
  } else {
    let instanceTag = 'public'
    if (user.worldId === 'private') {
      embed.setDescription(`Status: Private`)
        .setColor(0xff9344)
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