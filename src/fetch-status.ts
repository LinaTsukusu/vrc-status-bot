import {datastore} from 'nedb-promise'
import VrcApi from 'vrchat-client/dist/vrc-api'
import {UserResponse} from 'vrchat-client/dist/types/user'


export async function fetchStatus(api: VrcApi): Promise<{user: UserResponse, chatId: string, _id: string}[]> {
  const db = datastore({
    filename: '/db/users.db',
    autoload: true,
  })

  const users: {vrchatId: string, chatId: string, _id: string}[] = await db.find({})
  return await Promise.all(users.map(async v => {return {user: await api.user.getById(v.vrchatId), chatId: v.chatId, _id: v._id}}))
}
