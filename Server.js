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

        this._token = token;
        this._prefix = prefix;

        this._clients = {};
        this.util = require("util");

        this._setupServer();
        this._setupDiscordBot();
        
    }

    _setupDiscordBot() {
        this._discordBot = new NodeJSBot(this._prefix);
        this._discordBot.once("ready" () => {
            this._discordBot.loadCommands();
            console.log("Discord bot commands initialised");
        })

        //Add hooks
        this._discordBot.commandCollection.on("ran", console.log);

        this._discordBot.initialise(token);
    }

    _handleClose(client) {
        //TODO(Callum): Remove connection from
        console.log("Client disconnected");
    }

    _setupServer() {
        this.on("connection", (ws ,request) => {
            const params = new URLSearchParams(request.url.substring(2));
            const uniqueID = params.get("uniqueid");
            if (uniqueID == null) {
                //Decline connection
                ws.close();
            }
            this._clients[uniqueID] = ws;
            this.on("close", (client) => this._handleClose(client));
        })
    }
}

const wsServer = new DiscordHelperServer(server, TOKEN, PREFIX);
