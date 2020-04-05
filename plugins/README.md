# Server Plugins

The base server is pretty simple. It handles a few simple cases, clients connecting, disconnecting, changing rooms, and DJs setting tracks. (Also as of version 1.0 its pretty rough)

It is based on [socket.io](https://socket.io) to abstract a web socket-like implementation.

But extending functionality in `index.js` is going to be messy. So I've created a tiny plugin interface to augment the servers abilities.

## Plugin Interface

There are three methods that can be implented:

- `onConnect(socket){}` – Called when a new client connects
- `onDisconnect(socket){}` – Called when a client disconnects
- `onJoinRoom(socket, roomName){}` – Called when a client switches rooms

And one helper method to broadcast events:

- `broadcastToSocketsRoom(socket, eventName, eventData)` – useful for sending events to everyone in the same room as this socket.

## Socket Object Overview

_See [Socket.io's Docs](https://socket.io/docs/#Sending-and-receiving-events) for complete documentation on the socket object._

Sockets are a 1:1 private connection with a client.

Here is how to handle a message from a socket

```js
socket.on('friendRequest', function (from, msg) {
  console.log('I received a friend request by ', from, ' saying ', msg);
});
```

and here is how to emit a message on a socket

```js
socket.emit('friendRequest', {friend: 'Drew'};
```

## Example Plugin

The following example is the plugin used to tell the client to use the record scratch sound when the DJ changes.

```js
const PluginBase = require('./plugin_base');

module.exports = class DJChange extends PluginBase {
  // This method is called everytime a new client connects to the server
  // We are passed the socket, which is the Socket.io socket object.
  //  https://socket.io/docs/#Sending-and-receiving-events
  onConnect(socket) {
    // Now that we have the socket (a 1:1 mapping with the client), we are
    // going to listen to their connection, and wait to hear an event
    // requesting to become the DJ. If they fire this event,
    // they become the DJ and we want to do something with this.
    socket.on('becomeDJ', () => {
      // Now we are going to tell everyone else in this room
      // to respond with a "reaction" (the client handles reaction events
      // as playing a sound effect).
      //
      // Here we call send this helper method which broadcasts the reaction
      // to everyone in the room.
      this.broadcastToSocketsRoom(socket, 'reaction', 'dj-change');
    });
  }
};
```

## Creating your own plugin

1. Create a file in this directory (`plugins/`)
1. Create something fantastic!
1. Add it to `plugins/index.js` to be loaded when the server starts

## Everything in Banjo Server is based on rooms

Rooms are not discoverable. This is intentional, and while you can certainly create plugins to share and emit events between rooms, please becareful with this. There is something fun about private groups on the internet so be mindful of this when building plugins.

For example calling `this.io.emit()` from a plugin will send an event to everyone who is connected to this server.
