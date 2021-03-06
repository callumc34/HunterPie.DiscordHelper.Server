//https://github.com/websockets/ws
const dotenv = require("dotenv");
const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const { NodeJSBot } = require("nodejsdiscordbot");
const { commandConfig } = require("./config.js");
const { Server } = require("ws");

dotenv.config();

//TODO(Callum): Add error numbers

const PORT = process.env.PORT || 3000;
const INDEX = "./index.html";

const config = {
    timeout: process.env.TIMEOUT || 60000,
    token: process.env.TOKEN,
    prefix: process.env.PREFIX,
    serverUri: `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@callumc34-0.wrlkr.mongodb.net/DiscordHelperDB?retryWrites=true&w=majority`,
    db: process.env.DB,
    heartbeatInterval: process.env.HEARTBEAT_INTERVAL,
    commandConfig
}

const server = express()
    .use((req, res) => res.sendFile(INDEX, {root: __dirname}))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const DiscordHelperServer = class DiscordHelperserver extends Server {
    constructor(server, config) {
        super({ server });

        this._config = config;

        //Debugging - Delete later
        this.util = require("util");

        //Server DB
        //Note: ws.Server has own list of clients as this.clients
        this._clients = {};

        //Initialisation
        this._setupMongoDB()
            .then(() => {
                this._setupServer();
                this._setupDiscordBot(this._config.commandConfig);
            });
        
    }

    get prefix() {
        return this._config.prefix;
    }

    get timeout() {
        return this._config.timeout;
    }

    set timeout(val) {
        this._config.timeout = val;
    }

    async addUser(discordID, uniqueID) {
        //Prevent double users from one id or discord id
        await this.mongo.db(this._config.db).collection("users")
        .deleteMany({uniqueID});

        await this.mongo.db(this._config.db).collection("users")
        .deleteMany({discordID});

        return await this.mongo.db(this._config.db).collection(
            "users").insertOne({discordID, uniqueID});
    }

    async findUser(method) {
        let collection = await this.mongo.db(this._config.db).collection("users");
        if (method.uniqueID) {
            let _ = await collection.find({uniqueID: method.uniqueID}).toArray();
            return _[0];
        } else if (method.discordID) {
            let _ = await collection.find({discordID: method.discordID}).toArray();
            return _[0];
        } else {
            return false;
        }
    }

    async _handleMessage(socket, data) {
        //Data string valid formatting 
        //uniqueid;command;argc;value;value;...
        let information = data.split(";");
        clearTimeout(socket.timeout);
        let userExists = await this.findUser({uniqueID: information[0]})
        //Data handling
        if (information.pop(-1)) {
            socket.send("error;invalid-end-of-request-expected-semicolon;");
            return;
        } else if (socket.uniqueID != information[0]) {
            socket.send("error;wrong-id;");
            return false;
        } else if (!userExists) {
            socket.send(`error;no-discord-user-with-id-${information[0]};`);
            return false;
        } else {
            switch (information[1]) {
                case "heartbeat":
                    socket.heartbeatReceieved = true;
                    clearTimeout(socket.heartbeatTimeout);
                    return true;
                case "sid":
                    socket.awaitingChannel.send(information[3]);
                    socket.awaitingChannel = undefined;
                    return true;
                case "build":
                    socket.awaitingChannel.send(
                        decodeURIComponent(information[3]))
                    socket.awaitingChannel = undefined;
                    return true;
                case "dps":
                    let dmgStrings = information.splice(3).join("\n");
                    if (!dmgStrings) {
                        dmgStrings = "Failed to retrieve dps. Are you in a quest?";
                    }
                    socket.awaitingChannel.send(dmgStrings);
                    socket.awaitingChannel = undefined;
                    return true;
                case "error":
                    console.warn(information[3]);
                    socket.awaitingChannel.send("There was an error executing your command.");
                    socket.awaitingChannel = undefined;
                    return false;
                default:
                    socket.send("error;invalid-request-data;");
                    return false;
            }
            
        }        
    }

    async _handleCommands(ctx, args, result, command) {
        if (!result) {
            ctx.channel.send("Failed to execute command - Please check your arguments");
        }
        if (["sid", "build", "dps"].includes(command.name)) {
            let user = await this.findUser(
                {discordID: ctx.author.id});

            if (!user) {
                //Send a DM for them to add their uniqueID to the DB
                ctx.author.send(
                    `No unique ID found for this discord account - to add an ID respond to this message ${this.prefix}add {uniqueid}.`);
                return false;
            } 

            var uniqueID = user.uniqueID;
            var socket = this._clients[uniqueID];
            //Prevent sending command response in the wrong channel
            if (!socket) {
                ctx.channel.send(
                    "No connection found with that ID. Consider restarting your plugin.");
                return false;
            } else if (socket.awaitingChannel) {
                ctx.channel.send(
                    "Please let the bot run its current command before sending another command");
                return false;
            } else if (uniqueID) {
                //Send a request to the hunterpie plugin for the sid
                if (["sid", "build"].includes(command.name)) {
                    socket.send(`${uniqueID};request-${command.name};`);
                } else if (command.name == "dps") {
                    if (!result) {
                        return false;
                    }
                    socket.send(
                        `${uniqueID};request-${command.name};${result.join(";") + ";"}`);
                }
                
                socket.awaitingChannel = ctx.channel;
                //Set timeout for call for sid
                socket.timeout = setTimeout(function() {
                    socket.awaitingChannel = undefined;
                    ctx.channel.send(
                        `${ctx.author.toString()} could not fetch your ${command.name}. Please check your plugin is running correctly`);
                }, this._config.timeout);
                return true;
            } else {

            }
        } else if (command.name == "add") {
            await this.addUser(ctx.author.id, args[0]);
            ctx.channel.send("Your id has been added");
            return true;
        }
    }

    async _setupMongoDB() {        
        this.mongo = await new MongoClient(this._config.serverUri, {
         useNewUrlParser: true, useUnifiedTopology: true });
        await this.mongo.connect();
    }

    _setupDiscordBot(commandConfig = {}) {
        this._discordBot = new NodeJSBot(this.prefix, commandConfig);
        this._discordBot.once("ready", () => {
            this._discordBot.commandCollection.loadCommands();
        })

        //Add hooks
        this._discordBot.commandCollection.on(
            "ran", (ctx, args, result, command) => {
            this._handleCommands(ctx, args, result, command);
        });

        this._discordBot.initialise(this._config.token);
    }

    _setupServer() {
        this.on("connection", (ws, request) => {
            const params = new URLSearchParams(request.url.substring(2));
            const uniqueID = params.get("uniqueid");
            if (!uniqueID) {
                //Decline connection
                ws.close(4000, "error;no-id-specified;");
            }
            ws.uniqueID = uniqueID;
            this._clients[uniqueID] = ws;
            //Heartbeat for heroku connections
            ws.heartbeat = setInterval(() => {
                ws.send(`${ws.uniqueID};heartbeat;`);
                ws.heartbeatReceived = false;
                clearTimeout(ws.heartbeatTimeout);
                ws.heartbeatTimeout = setTimeout(function() {
                    if (!ws.heartbeatReceived) {
                        ws.close(1008, "error;no-heartbeat-received;");
                    } else {
                        ws.heartbeatReceived = false;
                    }
                }, this._config.heartbeatInterval);
            }, this._config.heartbeatInterval)
            var that = this;
            ws.on("message", function(data) {
                that._handleMessage(ws, data)
            });
        });
    }
}

const wsServer = new DiscordHelperServer(server, config);
