const { Command } = require("nodejsdiscordbot");
 
module.exports = class AddIDCommand extends Command {
                constructor () {
                        super(
                                "add",
                                  ["id"],
                                  []);
                }
 
                async _run (ctx, args) {
                    //ctx.channel.send("");
                }
        }
