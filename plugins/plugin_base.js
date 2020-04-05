module.exports = class PluginBase {
  constructor(io) {
    this.sockets = new Set();
    this.rooms = new Set();
    this.socketRooms = new Map();
    this.roomSockets = new Map();
    this.io = io;
    console.log(`new Plugin being registered ${this.constructor.name}`);
  }
  connected(socket) {
    this.sockets.add(socket);
    this.onConnect(socket);
  }

  disconnected(socket) {
    this.onDisconnect(socket);
    this.sockets.delete(socket);
    const lastRoom = this.socketRooms.get(socket.id);
    this.removeSocketFromRoom(lastRoom);
    this.socketRooms.delete(socket.id);
  }

  markSocketInRoom(socket, roomName) {
    this.rooms.add(roomName);
    // Remove socket from the previous room
    this.removeSocketFromRoom(socket, this.socketRooms.get(socket.id));
    // This is a map from socket to room
    this.socketRooms.set(socket.id, roomName);
    // This is a map of room to sockets
    const socketsInRoom = this.roomSockets.get(roomName) || new Set();
    socketsInRoom.add(socket);
    this.roomSockets.set(roomName, socketsInRoom);
    this.onJoinRoom(socket, roomName);
    this.roomSockets.forEach((sockets, roomName) => {
      console.log(
        `${this.constructor.name} Room Map :: ${roomName} ->  ${Array.from(
          sockets
        ).map((s) => s.id)}`
      );
    });
  }

  removeSocketFromRoom(socket, roomName) {
    // Remove socket from previous room
    if (roomName) {
      const socketsInOldRoom = this.roomSockets.get(roomName);
      socketsInOldRoom.delete(socket);
      this.roomSockets.set(roomName, socketsInOldRoom);
    }
  }

  /**
   * A helper method to broadcast an event to everyone in the
   * same room as this client.
   *
   * @param {Socket.io's socket Object} socket clients connection
   * @param {String} eventName name of the event to send
   * @param {Object|Any} eventData data to send with the event
   */
  broadcastToSocketsRoom(socket, eventName, eventData) {
    const room = this.socketRooms.get(socket.id);
    if (room) {
      console.log(`sending message to room ${eventName}`);
      this.roomSockets.get(room).forEach((s) => {
        if (s.id !== socket.id) {
          console.log(`sending ${eventName} to ${s.id} (from ${socket.id})`);
          s.emit(eventName, eventData);
        }
      });
    } else {
      console.error(
        `Unable to send event ${eventName} to room, no matching room found`
      );
    }
  }

  /**
   * Your plugin will be notified when a new client connects
   * to the sever. This socket represents a private connection
   * to listen and emit messages to this client.
   *
   * For more information on what you can do with the socket
   * see https://socket.io/docs/#Sending-and-receiving-events
   *
   * @param {Socket.io Socket} socket The new connections socket
   */
  onConnect(socket) {}

  /**
   * Called when a client disconnects. Unless you are doing
   * something special, you probably don't need to do anything here
   *
   * @param {Socket.io Socket Object} socket disconnecing socket
   */
  onDisconnect(socket) {}

  /**
   * Is called when the client enters a room (or when changing rooms)
   *
   * @param {Socket.io Socket Object} socket client's socket
   * @param {String} roomName The name of the room the client joined
   */
  onJoinRoom(socket, roomName) {}
};
