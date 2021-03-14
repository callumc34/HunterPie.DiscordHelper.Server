const dotenv = require("dotenv");
const webSocketServer = require("websocket").server;
const http = require("http");



dotenv.config();

const server = http.createServer();
server.listen(process.env.PORT);

const DiscordHelperServer = class DiscordHelperserver extends webSocketServer {
    constructor(httpS, autoAcceptConnections = false) {
        super({httpServer: httpS, autoAcceptConnections: false});

        this._clients = {};
        this.util = require("util");

        this._setupServer();
        
    }

    _setupServer() {
        this.on("request", function(request) {
            const uniqueID;
            if (uniqueID = request.resourceURL.query.uniqueID == null) {
                //Decline connection
                request.reject();
            }
            const connection = request.accept(null, request.origin);
            this._clients[uniqueID] = connection;
        })
    }
}

const wsServer = new DiscordHelperServer(server);