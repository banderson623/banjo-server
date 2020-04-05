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
    this.onJoinRoom(roomName);
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
  sendToRoomForSocket(socket, eventName, eventData) {
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
  onConnect() {}
  onDisconnect() {}
  onJoinRoom(roomName) {}
};
