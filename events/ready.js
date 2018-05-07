const { Event } = require('klasa');
const { BOT_ACTIVITY } = require('../config.json');

module.exports = class extends Event {

    run() {
        return this.client.user.setActivity(BOT_ACTIVITY ? BOT_ACTIVITY : 'Sneyra, help', { type: 'PLAYING' })
            .catch(err => this.client.emit('log', err, 'error'));
    }

};
