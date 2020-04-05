// Loads a plugin in a room.
class RoomPluginBase {
  constructor(roomName, roomObject, io) {
    this.roomName = roomName;
    this.roomObject = roomObject;
    this.io = io;
    this.setup();
  }

  roomObjectChanged(roomObject) {
    // clone this and send it incase ya want to do diffs
    const oldRoomObject = { ...this.roomObject };
    this.roomObject = roomObject;
    this.onRoomObjectChanged(oldRoomObject);
  }

  sendMessageToRoom(eventName, data) {
    console.log(
      `${this.constructor.name} sending event - ${eventName} with data (${data})`
    );
    this.io.to(this.roomName).emit(eventName, data);
  }

  // PUBLIC INTERFACE BELOW ----------------

  static eventsToListenFor() {
    return [];
  }

  // Called when the plugin is setup
  setup() {}

  // Called when the room has a new DJ or new people
  onRoomObjectChanged(roomObject, previousRoom) {}

  // Called when one of your messages you registered for is received
  messageRecieved(messageName, data, fromClientSocket) {}
}

module.exports = class ReactionInRoomPlugin extends RoomPluginBase {
  static eventsToListenFor() {
    return ['reaction'];
  }

  // This reflects the event back to everyone in the room
  messageRecieved(name, data, fromClientSocket) {
    console.log('handling message received', name, data, fromClientSocket.id);
    this.sendMessageToRoom(name, data);
  }
};
