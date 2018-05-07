const { Command, RichMenu } = require('klasa');
const { ANY_SKIP } = require('../../config.js');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: ['text'],
            aliases: ['vol'],

            usage: '[-force]',
            description: 'Skip the current song.'
        });

        this.requireMusic = true;
    }

    async run(msg, [force]) {
        const { music } = msg.guild;

        if (ANY_SKIP === true) {
            return this.skip(msg, music);
        }

        if (music.voiceChannel.members.size > 4) {
            if (force) {
                const hasPermission = await msg.hasAtLeastPermissionLevel(5);
                if (hasPermission === false) throw 'You can\'t execute this command with the force flag. You must be at least a Moderator Member.';
            } else {
                const response = this.handleSkips(music, msg.author.id);
                if (response) return msg.send(response);
            }
        }

        return this.skip(msg, music);
    }

    async skip(msg, musicInterface) {
        const embed = new RichMenu(new MessageEmbed()
            .setColor('#2661a5')
            .setTitle(`Skipped ${musicInterface.queue[0].title} ⏭️`)
        );
        embed.emojis = [];
        embed.footered = true;
        await embed.run(await msg.send('Loading ..'));
        musicInterface.skip(true);
        return null;
    }

    handleSkips(musicInterface, user) {
        if (ANY_SKIP === true) return true;
        if (!musicInterface.queue[0].skips) musicInterface.queue[0].skips = new Set();
        if (musicInterface.queue[0].skips.has(user)) return 'You have already voted to skip this song.';
        musicInterface.queue[0].skips.add(user);
        const members = musicInterface.voiceChannel.members.size - 1;
        return this.shouldInhibit(members, musicInterface.queue[0].skips.size);
    }

    shouldInhibit(total, size) {
        if (total <= 3) return true;
        return size >= total * 0.4 ? false : `🔸 | Votes: ${size} of ${Math.ceil(total * 0.4)}`;
    }

};
