// Author: Devestoguy <devestoguy@gmail.com>
// Ayudante del Team (c) 2020
// Created: 27/6/2020 12:30:8
// Modified: 9/7/2020 10:55:49

const Api = require('@hugovidafe/useful-api');

module.exports = {
  name: 'eval',
  args: true,
  usage: '[...toEval]',
  perm: 'Developer',
  execute(message, embed, { client, args, API, prefixUsed, version }) {
    function clean(text) {
      if (typeof text === 'string')
        return text
          .replace(/`/g, '`' + String.fromCharCode(8203))
          .replace(/@/g, '@' + String.fromCharCode(8203));
      else return text;
    }
    try {
      const code = args.join(' ');
      let evaled = eval(code);

      if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);

      message.channel.send(clean(evaled), { code: 'xl' });
    } catch (err) {
      message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
  },
};
