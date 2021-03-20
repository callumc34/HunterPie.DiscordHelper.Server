const { Command } = require("nodejsdiscordbot");

module.exports = class DPSCommand extends Command {
                constructor () {
                        super(
                                "dps",
                                  [],
                                  ["start", "range"]);
                }
 
                async _run (ctx, args) {                    
                    //Check args and convert to a range
                    if (args.length == 0) {
                        return [1, 4];
                    }
                    var argRange = args.map(Number);
                    if (argRange.length == 1) {
                        return argRange;
                    } else if (!argRange.every(i => typeof i === "number") 
                        || argRange[1] < argRange[0] || argRange.length > 2 || argRange[1] > 4 || argRange[0] < 1) {
                        ctx.channel.send("Improper use of dps command");
                        return false;
                    } else {
                        return argRange;
                    }

                }
        }
