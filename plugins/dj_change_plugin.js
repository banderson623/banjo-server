const PluginBase = require('./plugin_base');

module.exports = class DJChange extends PluginBase {
  onConnect(socket) {
    // Reflect the message back
    socket.on('becomeDJ', () => {
      this.broadcastToSocketsRoom(socket, 'reaction', 'dj-change');
    });
  }
};
