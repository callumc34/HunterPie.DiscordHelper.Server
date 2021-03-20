# HunterPie.DiscordHelper.Server

<img src="icon.png" width=50%>

Server for the HunterPie Plugin [DiscordHelper](https://github.com/callumc34/HunterPie.DiscordHelper).

To add this bot to your server click [this](https://discord.com/api/oauth2/authorize?client_id=820790788682022912&permissions=2147601472&scope=bot) link.

Commands:

- $help - show list of commands
- $add {uniqueID} - adds your uniqueID to the database so you can use the discord bot
- $sid - Sends your sid to the discord channel
- $build - sends your build to the discord channel
- $dps {start} {end} - Lists the dps from start user to end user - Leave blank to list all

Note: The prefix can be changed using the PREFIX env variable

## Setup your own discord bot

A default discord bot is always up at https://server-mhwdiscordhelper.herokuapp.com but if you would like to run and customise your own:

1. Clone this repository
2. Make a .env file with all your custom variables
3. Run npm Start
4. Point your plugin Config.json to your server ip e.g ws://server-mhwdiscordhelper.herokuapp.com

## Thank you to

Pixee for the awesome logo

Archdevil1911, ColdHarbour, iLikePvE, Kino and Nariety for testing!
