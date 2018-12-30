import VrcApi from 'vrchat-client/dist/vrc-api'
import {Message, TextChannel} from 'discord.js'
import {fetchStatus} from './fetch-status'
import {createEmbed} from './status-embed'
import {datastore} from 'nedb-promise'


export async function sendStatusMessage(api: VrcApi, channel: TextChannel) {
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