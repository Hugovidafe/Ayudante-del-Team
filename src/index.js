// Author: Hugovidafe <Hugo.vidal.ferre@gmail.com>
// Ayudante de Hugovidafe (c) 2020
// Created: 27/6/2020 11:13:38
// Modified: 4/7/2020 0:30:44

const fs = require('fs');
const { Client, Collection } = require('discord.js');

const express = require('express')
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
    res.send("¡El auydante del Team está encendido!")
})

app.get('/folders/*', (req, res) => {
    const files = [];
    fs.readdirSync(__dirname + "/" + req.params[0]).forEach(file => {
        files.push(file)
    });
    res.send(files.join("\n"))
})


const client = new Client();
client.commands = new Collection();
client.config = require('./database/config.json')
client.keys = require('./keys');
client.dirname = __dirname;

new Collection().filter(v => {
    v.perm == "User"
}).array().join(", ")

const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js') && !file.startsWith('.'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const eventFiles = fs.readdirSync(__dirname + '/events').filter(file => file.endsWith('.js') && !file.startsWith('.'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    eventName = file.split('.').slice(0, -1).join('.')
    client.on(eventName, event.bind(null, client));
}

app.listen(port)

client.login(client.keys.discord.token)