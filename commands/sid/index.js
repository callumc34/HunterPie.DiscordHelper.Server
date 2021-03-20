const { Command } = require("nodejsdiscordbot");
 
module.exports = class SessionIDCommand extends Command {
                constructor () {
                        super(
                                "sid",
                                  [],
                                  []);
                }
 
                async _run (ctx, args) {
                    return true;
                }
        }
