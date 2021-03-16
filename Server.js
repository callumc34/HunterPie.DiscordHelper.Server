//https://github.com/websockets/ws
const dotenv = require("dotenv");
const express = require("express");
const { NodeJSBot } = require("nodejsdiscordbot")
const { Server } = require("ws");

dotenv.config();

//TODO(Callum): Add error numbers

const PORT = process.env.PORT || 3000;
const INDEX = "./index.html";

const config = {
    timeout: process.env.TIMEOUT,
    token: process.env.TOKEN,
    prefix: process.env.PREFIX
}

const server = express()
    .use((req, res) => res.sendFile(INDEX, {root: __dirname}))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const DiscordHelperServer = class DiscordHelperserver extends Server {
    constructor(server, config) {
        super({ server });

        this._config = {
            timeout: config.timeout || 60000,
            prefix: config.prefix || "$",
            token: config.token
        };

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

    get prefix() {
        return this._config.prefix;
    }

    set timeout(val) {
        this._config.timeout = val;
    }

    get timeout() {
        return this._config.timeout;
    }

    findSocket(id) {
        return this.clients.find(ws => ws.uniqueID === id);
    }

    _handleMessage(socket, data) {
        //Data string valid formatting 
        //uniqueid;command;argc;value;value;...
        let information = data.split(";");
        clearTimeout(socket.timeout);
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
                    //Send back error response
                    socket.send("error;invalid-request-data;")
                    break;
            }
        }        
    }

    //TODO(Callum): Permanent storage for unique id with discord id

    _handleCommands(ctx, args, result, command) {
        switch (command.name) {
            case "sid":
                //Match ctx user to a client and then ping for a sid
                var uniqueID;
                if (uniqueID = this._discordUsers[ctx.author.id] != undefined) {
                    //Send a request to the hunterpie plugin for the sid
                    let socket = this._findSocket(uniqueID);
                    socket.send(`${uniqueID};request-sid;`);
                    //Prevent sending command response in the wrong channel
                    if (socket.awaitingChannel != undefined) {
                        ctx.channel.send(
                            "Please let the bot run its current command before sending another command");
                        return;
                    }
                    socket.awaitingChannel = ctx.channel;
                    //Set timeout for call for sid
                    socket.timeout = setTimeout(function() {
                        ctx.channel.send(
                            ctx.author.toString()
                             + " could not fetch your sid. Please check your plugin is running correctly")
                    }, this._config.timeout);
                } else {
                    //Send a DM for them to add their uniqueID to the DB
                    ctx.author.send(
                        `No unique ID found for this discord account - to add an ID respond to this message ${this.prefix}add {uniqueid}.`);
                }
                break;

            case "build":
                break;

            case "add":
                this._disordUsers[ctx.author.id] = args[0];
                ctx.channel.send("Your id has been added");
                break;

            default:
                break;
        }
    }

    _setupDiscordBot() {
        this._discordBot = new NodeJSBot(this.prefix);
        this._discordBot.once("ready", () => {
            this._discordBot.commandCollection.loadCommands();
        })

        //Add hooks
        this._discordBot.commandCollection.on(
            "ran", (ctx, args, result, command) => {
            this._handleCommands(ctx, args, result, command)
        });

        this._discordBot.initialise(this._config.token);
    }

    _setupServer() {
        this.on("connection", (ws, request) => {
            const params = new URLSearchParams(request.url.substring(2));
            const uniqueID = params.get("uniqueid");
            //TODO(Callum): check if multiple connections from one id   
            if (uniqueID == null) {
                //Decline connection
                ws.close(4000, "error;no-id-specified;");
            }
            ws.uniqueID = uniqueID;
            var that = this;
            ws.on("message", function(data) {
                that._handleMessage(ws, data)
            });
        });
    }
}

const wsServer = new DiscordHelperServer(server, config);
