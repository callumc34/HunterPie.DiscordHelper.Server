//https://github.com/websockets/ws
const dotenv = require("dotenv");
const express = require("express");
const { NodeJSBot } = require("nodejsdiscordbot")
const { Server } = require("ws");

dotenv.config();

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

    _findSocket(id) {
        return this.clients.find(ws => ws.uniqueID === id);
    }

    _handleMessage(data) {
        
    }

    _handleCommands(ctx, args, result, command) {
        if (command.name == "sid") {
            //Match ctx user to a client and then ping for a sid
            var uniqueID;
            if (uniqueID = this._discordUsers[ctx.author.id] != undefined) {
                //Send a request to the hunterpie plugin for the sid
                this._findSocket(uniqueID).send();
            } else {
                //Send a DM for them to add their uniqueID to the DB
                ctx.author.send()
            }
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
                ws.close(4000, "No unique ID specified");
            }
            ws.uniqueID = uniqueID;
            //TODO(Callum): Get ws passed through to message handler
            ws.on("message", (data) => this._handleMessage(data))
        })
    }
}

const wsServer = new DiscordHelperServer(server, TOKEN, PREFIX);
