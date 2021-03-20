const { Command } = require("nodejsdiscordbot");
 
module.exports = class HelpCommand extends Command {
                constructor () {
                        super(
                                "help",
                                  [],
                                  []);
                }
 
                async _run (ctx, args) {
                    ctx.channel.send(`Current commands:
                        help - see this command
                        sid - send your session id to this channel
                        build - post your build to this channel
                        dps - {start} {end} Shows dps in ranges leave blank to show all or no end to show one
                        `)
                    return true;
                }
        }
