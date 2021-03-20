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
                        `)
                    return true;
                }
        }
