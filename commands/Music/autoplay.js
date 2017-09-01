const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, { runIn: ['text'] });
    }

    async run(msg) {
        if (!msg.member.voiceChannel) throw 'You are not connected in a voice channel.';
        if (!msg.guild.me.voiceChannel) throw 'I am not connected in a voice channel.';
        if (msg.member.voiceChannel.id !== msg.guild.me.voiceChannel.id) throw 'You must be in the same voice channel as me.';

        const { music } = msg.guild;
        const enabled = music.autoplay === false;

        music.autoplay = enabled;

        return msg.send(`Dear ${msg.author}, YouTube AutoPlay has been ${enabled ? 'enabled' : 'disabled'}.`);
    }

};