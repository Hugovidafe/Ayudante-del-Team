// Author: Devestoguy <devestoguy@gmail.com>
// Ayudante del Team (c) 2020
// Created: 27/6/2020 12:30:26
// Modified: 2/10/2020 21:38:29

const { Api, version } = require('@hugovidafe/useful-api');
const { MessageEmbed } = require('discord.js');
const ISO6391 = require('iso-639-1');

const roles = {
  applications: {
    ayudante: ['Developer', 'Team', 'User'],
  },
  profiles: {
    Developer: ['ayudante.*'],
    Team: ['ayudante.Team', 'ayudante.User'],
    User: ['ayudante.User'],
  },
};

module.exports = async (client, message) => {
  if (message.author.bot || message.author.system) return;
  const server = client.guilds.cache.get(client.config.guild);

  // API / Base de datos
  const API = new Api({
    path_langs: `${client.dirname}/database/i18n`,
    roles: roles,
  });

  switch (client.env) {
    case 'master':
      client.confenv = client.config.master;
      break;
    case 'alpha':
      client.confenv = client.config.alpha;
      break;
  }

  if (
    client.env != 'master' &&
    message.guild != null &&
    client.confenv.prefix == client.config.master.prefix &&
    !new RegExp(`^<@!?${client.user.id}>`).test(message.content)
  ) {
    if (
      client.env == 'alpha'
        ? message.channel.members.has(client.config.master.id)
          ? true
          : false
        : false
    )
      return;
  }

  // Prefijos
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionRegex = new RegExp(`^(<@!?${client.user.id}>)\\s*`);
  const prefixRegex = client.confenv.prefix
    ? new RegExp(
        `^(<@!?${client.user.id}>|${escapeRegex(client.confenv.prefix)})\\s*`
      )
    : mentionRegex;
  var args = '';
  var prefixUsed = '';
  if (message.channel.type == 'dm' && !prefixRegex.test(message.content)) {
    args = message.content.split(/ +/);
  } else if (prefixRegex.test(message.content)) {
    const [, matchedPrefix] = message.content.match(prefixRegex);
    args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    prefixUsed = mentionRegex.test(matchedPrefix)
      ? matchedPrefix + ' '
      : matchedPrefix;
  } else return;

  // Idiomas
  const i18n = require('fs')
    .readdirSync(`${client.dirname}/database/i18n`)
    .filter((file) => file.endsWith('.json') && !file.startsWith('.'));
  const lang = i18n
    .map((lang) => {
      const Langs = lang.substring(0, lang.lastIndexOf('.'));
      return (
        '<' +
        ISO6391.getNativeName(Langs) +
        '/' +
        ISO6391.getName(Langs) +
        '/' +
        Langs +
        `>\n> ${prefixUsed}user config lang ` +
        Langs
      );
    })
    .join(`\n`);

  // Comprueba si el bot puede enviar un mensaje
  if (
    message.channel.type !== 'dm' &&
    !message.guild.members.cache
      .get(client.user.id)
      .hasPermission('SEND_MESSAGES')
  )
    message.author.send(
      embed
        .setColor('#be1931')
        .setTitle(
          ':exclamation: ' +
            API.langs.__l('onMessage.noLang').join('\n:exclamation: ')
        )
        .setDescription(
          '```md\n# ' +
            API.langs
              .__l('onMessage.noSend.description.one', {
                permRequired: 'SEND_MESSAGES',
              })
              .join('\n# ') +
            '\n\n' +
            lang +
            '```'
        )
        .setTimestamp()
        .setFooter(
          '© ' + new Date().getFullYear() + ' ' + client.user.username,
          client.user.displayAvatarURL()
        )
    );

  // Comprueba el comando
  const commandName = args.shift().toLowerCase();
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  // Establece el idioma al español
  API.langs.setLocale('es');

  // Envia el mensaje de desarrollo
  message.channel
    .send(
      new MessageEmbed()
        .setColor('#be1931')
        .setTitle(
          ':exclamation: ' +
            API.langs.__('onMessage.inDeveloping.title', client.user.username)
        )
        .setDescription(API.langs.__('onMessage.inDeveloping.description'))
        .setTimestamp()
        .setFooter(
          '© ' + new Date().getFullYear() + ' ' + client.user.username,
          client.user.displayAvatarURL()
        )
    )
    .then((message) =>
      setTimeout(function () {
        message.delete();
      }, 8000)
    );

  // Si el comando no existe
  if (!command)
    return message.channel.send(
      new MessageEmbed()
        .setColor('#be1931')
        .setTitle(':exclamation: ' + API.langs.__('onMessage.noCommand'))
        .setDescription(
          '**' +
            API.langs.__('commands.help.embed.fields.allCommands', {
              prefix: prefixUsed,
            }) +
            '**'
        )
        .setTimestamp()
        .setFooter(
          '© ' + new Date().getFullYear() + ' ' + client.user.username,
          client.user.displayAvatarURL()
        )
    );

  // Recoje el rol del usuario
  var roleMember = 'User';
  if (
    server.members.cache.has(message.author.id) &&
    server.members.cache
      .get(message.author.id)
      .roles.cache.has(client.config.TeamRole)
  )
    roleMember = 'Team';
  if (message.author.id == client.config.owner) roleMember = 'Developer';

  if (command.perm) {
    if (!API.roles.getProfile(roleMember).hasRoles('ayudante.' + command.perm))
      return message.channel.send(
        new MessageEmbed()
          .setColor('#be1931')
          .setTitle(
            ':exclamation: ' +
              API.langs.__('onMessage.noPerms.title', command.name)
          )
          .setDescription(
            API.langs.__('onMessage.noPerms.description', {
              userPerm: API.langs.__('users.roles.' + roleMember + '.one'),
              commandPerm: API.langs.__('users.roles.' + command.perm + '.one'),
            })
          )
          .setTimestamp()
          .setFooter(
            '© ' + new Date().getFullYear() + ' ' + client.user.username,
            client.user.displayAvatarURL()
          )
      );
  }

  // Falta de argumentos
  if (command.args && !args.length) {
    if (command.usage) {
      return message.channel.send(
        new MessageEmbed()
          .setColor('#be1931')
          .setTitle(':exclamation: ' + API.langs.__('onMessage.noArgs.title'))
          .setDescription(
            API.langs.__(
              'onMessage.noArgs.usage',
              `${command.name} ${command.usage}`
            )
          )
          .setTimestamp()
          .setFooter(
            '© ' + new Date().getFullYear() + ' ' + client.user.username,
            client.user.displayAvatarURL()
          )
      );
    }
    return message.channel.send(
      new MessageEmbed()
        .setColor('#be1931')
        .setTitle(':exclamation: ' + API.langs.__('onMessage.noArgs.title'))
        .setDescription(API.langs.__('onMessage.noArgs.noUsage'))
        .setTimestamp()
        .setFooter(
          '© ' + new Date().getFullYear() + ' ' + client.user.username,
          client.user.displayAvatarURL()
        )
    );
  }

  try {
    command.execute(message, new MessageEmbed(), {
      client,
      args,
      API,
      prefixUsed,
      roleMember,
      version,
    });
  } catch (error) {
    console.error(error);
    message.channel.send(
      new MessageEmbed()
        .setColor('#be1931')
        .setTitle(
          ':exclamation: ' +
            API.langs.__('onMessage.commandError.title', command.name)
        )
        .setDescription(API.langs.__('onMessage.commandError.description'))
        .setTimestamp()
        .setFooter(
          '© ' + new Date().getFullYear() + ' ' + client.user.username,
          client.user.displayAvatarURL()
        )
    );
  }
};
