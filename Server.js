//https://github.com/websockets/ws
const dotenv = require("dotenv");
const express = require("express");
const { NodeJSBot } = require("nodejsdiscordbot")
const { Server } = require("ws");

dotenv.config();

//TODO(Callum): Add error numbers

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const PREFIX = process.env.PREFIX;
const INDEX = "./index.html";

const server = express()
    .use((req, res) => res.sendFile(INDEX, {root: __dirname}))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const DiscordHelperServer = class DiscordHelperserver extends Server {
    constructor(server, token, prefix) {
        super({ server });

        //Discord bot vars
        this._token = token;
        this._prefix = prefix;

        //Debugging - Delete later
        this.util = require("util");

        //Server DB
        //Note: ws.Server has own list of clients as this.clients
        //All clients are assigned uniqueID on connection
        this._discordUsers = {};

        //Initialisation
        this._setupServer();
        this._setupDiscordBot();
        
    }

    findSocket(id) {
        return this.clients.find(ws => ws.uniqueID === id);
    }

    _handleMessage(socket, data) {
        //Data string valid formatting 
        //uniqueid;command;argc;value;value;...
        let information = data.split(";");
        //Data handling
        if (information.pop(-1) != "") {
            socket.send("error;invalid-end-of-request-expected-semicolon;");
            return;
        } else if (this._discordUsers[information[0]] == undefined) {
            socket.send(`error;no-discord-user-with-id-${information[0]};`);
        } else {
            switch (information[1]) {
                //Send sid to channel
                case "sid":
                    socket.awaitingChannel.send(information[3]);
                    socket.awaitingChannel = undefined;
                    break;
                case "build":
                    socket.awaitingChannel.send(information[3]);
                    socket.awaitingChannel = undefined;
                    break;
                default:
                    // statements_def
                    socket.send("error;invalid-request-data;")
                    break;
            }
        }

        
    }

    _handleCommands(ctx, args, result, command) {
        switch (command.name) {
            case "sid":
                //Match ctx user to a client and then ping for a sid
                var uniqueID;
                if (uniqueID = this._discordUsers[ctx.author.id] != undefined) {
                    //Send a request to the hunterpie plugin for the sid
                    let socket = this._findSocket(uniqueID);
                    socket.send(`${uniqueID};request-sid;`);
                    socket.awaitingChannel = ctx.channel;
                    //Add timeout for sid being sent
                } else {
                    //Send a DM for them to add their uniqueID to the DB
                    ctx.author.send()
                }
                break;

            case "build":
                break;
            default:
                ctx.channel.send(`That is not a valid command - to see valid commands type ${this._prefix}help`)
                break;
        }
    }

    _setupDiscordBot() {
        this._discordBot = new NodeJSBot(this._prefix);
        this._discordBot.once("ready", () => {
            this._discordBot.commandCollection.loadCommands();
        })

        //Add hooks
        this._discordBot.commandCollection.on("ran", (ctx, args, result, command) => {
            this._handleCommands(ctx, args, result, command)
        });

        this._discordBot.initialise(this._token);
    }

    _setupServer() {
        this.on("connection", (ws ,request) => {
            const params = new URLSearchParams(request.url.substring(2));
            const uniqueID = params.get("uniqueid");
            if (uniqueID == null) {
                //TODO(Callum): check if multiple connections from one id
                //Decline connection
                ws.close(4000, "error;no-id-specified;");
            }
            ws.uniqueID = uniqueID;
            var that = this;
            ws.on("message", function(data) {
                that._handleMessage(this, data);
            })
        })
    }
}

const wsServer = new DiscordHelperServer(server, TOKEN, PREFIX);
