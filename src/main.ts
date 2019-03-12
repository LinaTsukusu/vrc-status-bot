import vrc from 'vrchat-client'
import {Client, TextChannel} from 'discord.js'

import {registerUser} from './commands/register-user'
import {removeUser} from './commands/remove-user'
import {sendStatusMessage} from './send-message'


(async () => {
  const client = new Client()
  await client.login(process.env.TOKEN)
  const channel = (<TextChannel>client.channels.get(process.env.CHANNEL_ID))
  const api = await vrc.login(process.env.VRC_USERNAME, process.env.VRC_PASSWORD)

  sendStatusMessage(api, channel)
  console.log(`updated at ${new Date().toTimeString()}`)
  setInterval(() => {
    sendStatusMessage(api, channel)
    console.log(`updated at ${new Date().toTimeString()}`)
  }, Number(process.env.CYCLE) * 1000)

  client.on('message', message => registerUser(message, api))
  client.on('message', removeUser)
})()

