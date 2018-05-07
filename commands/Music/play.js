const { Command, RichMenu } = require('klasa');

const snekfetch = require('snekfetch');
const { MessageEmbed } = require('discord.js');
const { GOOGLE_SEARCH } = require('../../config.json');
const fetchURL = url => snekfetch.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${url}&key=${GOOGLE_SEARCH}`)
    .then(result => result.body);

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: ['text'],

            usage: '<url:string>',
            description: 'Adds a song the the queue.'
        });
        this.regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/\S*(?:(?:\/e(?:mbed)?)?\/|watch\/?\?(?:\S*?&?v=))|youtu\.be\/)([\w-]{11})(?:[^\w-]|$)/;

        this.delayer = time => new Promise(res => setTimeout(() => res(), time));
    }

    async run(msg, [url]) {
        const youtubeURL = await this.getURL(url);
        if (!youtubeURL) throw 'Not found.';

        const { music } = msg.guild;
        await music.add(msg.author, youtubeURL);

        if (!music.dispatcher || !music.voiceChannel) await this.client.commands.get('join').run(msg);
        if (music.status === 'paused') await this.client.commands.get('resume').run(msg);
        if (music.status === 'playing') {
            const embed = new RichMenu(new MessageEmbed()
                .setColor('#a3419c')
                .setAuthor(`Searching 🔎 ${url}`, 'https://cdn.discordapp.com/emojis/335112740957978625.png?v=1')
            );
            embed.emojis = [];
            embed.footered = true;
            return await embed.run(await msg.send('Loading ..'));
        }
        music.status = 'playing';
        music.channel = msg.channel;
        return this.play(music);
    }

    async play(musicInterface) {
        if (musicInterface.status !== 'playing') return null;

        const song = musicInterface.queue[0];

        if (!song) {
            if (musicInterface.autoplay) return this.autoPlayer(musicInterface).then(() => this.play(musicInterface));
            return musicInterface.channel.send('⏹ Queue is empty').then(() => musicInterface.destroy());
        }

        const embed = new RichMenu(new MessageEmbed()
            .setColor(0x673AB7)
            .setAuthor('Now playing', musicInterface.client.user.displayAvatarURL())
            .setTitle(`${song.title} ${song.url}`)
            .setThumbnail(song.thumbnail)
            .setFooter(`Requested by ${song.requester.username}`, song.requester.displayAvatarURL())
        );
        embed.emojis = [];
        embed.footered = true;

        await embed.run(await musicInterface.channel.send('Loading ..'));
        await this.delayer(300);

        return musicInterface.play()
            .then(
                (dispatcher) => dispatcher
                    .on('end', () => {
                        musicInterface.skip();
                        this.play(musicInterface);
                    })
                    .on('error', (err) => {
                        musicInterface.channel.send('Something very weird happened! Sorry for the incovenience :(');
                        musicInterface.client.emit('log', err, 'error');
                        musicInterface.skip();
                        this.play(musicInterface);
                    }),
                (message) => {
                    musicInterface.channel.send(message);
                    musicInterface.destroy();
                }
            );
    }

    async getURL(url) {
        const id = this.regExp.exec(url);
        if (id) return `https://youtu.be/${id[1]}`;
        const data = await fetchURL(encodeURIComponent(url));
        const video = data.items.find(item => item.id.kind !== 'youtube#channel');

        return video ? `https://youtu.be/${video.id.videoId}` : null;
    }

    autoPlayer(musicInterface) {
        return musicInterface.add('YouTube AutoPlay', musicInterface.next);
    }

};
