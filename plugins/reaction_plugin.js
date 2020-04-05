const PluginBase = require('./plugin_base');

module.exports = class ReactionPlugin extends PluginBase {
  onConnect(socket) {
    // Reflect the message back
    socket.on('reaction', (reaction) => {
      this.sendToRoomForSocket(socket, 'reaction', reaction);
    });
  }
};
