# VRC Status Bot
> VRChat Status Check Bot for Discord

## Usage
```bash
git clone https://github.com/LinaTsukusu/vrc-status-bot.git
vi docker-compose.yml
# Change Envriment params
docker-compose up -d
```

## Enviroment Params
- TOKEN
  - DiscordBot Token
- VRC_USERNAME
  - VRChat username for bot
- VRC_PASSWORD
  - VRChat password for bot
- CHANNEL_ID
  - Channel ID to show status
- SETTING_CHANNEL_ID
  - Channel ID to set config
- CYCLE
  - Status update frequency (seconds)
  
## Commands
> Can be used on the setting channel
- Register a checked user
```
# Set own
/register (VRChatUsername | VRChatUserID)
# Set other
/register @mention#0000 (VRChatUsername | VRChatUserID)
```
- Remove a checked user
```
/remove @mention#0000
```

## TODO
- `vrchat-client`をログイン以外の方法作ったほうがいいかも
- ユーザ管理をutilみたいに切り分けて置きたい
  - 今後メッセージ送信とか作りたいので
 