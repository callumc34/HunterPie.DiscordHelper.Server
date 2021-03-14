const dotenv = require("dotenv");
const express = require("express");
const { Server } = require("ws");

dotenv.config();

const PORT = process.env.PORT || 3000;
const INDEX = "./index.html";

const server = express()
    .use((req, res) => res.sendFile(INDEX, {root: __dirname}))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const DiscordHelperServer = class DiscordHelperserver extends Server {
    constructor(server) {
        super({ server });

        this._clients = {};
        this.util = require("util");

        this._setupServer();
        
    }

    _handleClose(client) {
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

const wsServer = new DiscordHelperServer(server);