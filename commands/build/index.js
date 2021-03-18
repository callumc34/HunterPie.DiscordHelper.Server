const { Command } = require("nodejsdiscordbot");
 
module.exports = class BuildCommand extends Command {
                constructor () {
                        super(
                                "build",
                                  [],
                                  []);
                }
 
                async _run (ctx, args) {
                    //ctx.channel.send("");
                }
        }
