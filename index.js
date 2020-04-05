const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');
const AllPlugins = require('./plugins');

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);

const port = process.env.PORT || 4000;

let rooms = {};
let plugins = [];

const registerPlugins = (io) => {
  plugins = AllPlugins.map((Plugin) => new Plugin(io));
};

const notifyPluginsOfConnection = (socket) => {
  console.log(`plugins being notified socket connect`);
  plugins.forEach((plug) => plug.connected(socket));
};

const notifyPluginsOfDisonnection = (socket) => {
  console.log(`plugins being notified socket disconnect`);
  plugins.forEach((plug) => plug.disconnected(socket));
};

const notifyPluginsOfJoinedRoom = (socket, roomName) => {
  console.log(`plugins being notified of room join`);
  plugins.forEach((plug) => plug.markSocketInRoom(socket, roomName));
};

registerPlugins(io);

io.on('connection', (socket) => {
  let inRoomName = '';
  let clientName = '';

  console.log('a user connected');

  notifyPluginsOfConnection(socket);

  const updateClientRoom = () => {
    console.log('sendng room event', rooms[inRoomName]);
    io.to(inRoomName).emit('roomEvent', rooms[inRoomName]);
  };

  const leaveRoom = (roomName, name) => {
    if (rooms[roomName]) {
      console.log('removing', name, 'from', roomName);
      rooms[roomName].people = rooms[roomName].people.filter((n) => n !== name);
      rooms[roomName].count--;
      io.to(roomName).emit('roomEvent', rooms[roomName]);
      console.log('rooms', rooms[roomName]);

      if (
        rooms[roomName].count === undefined ||
        rooms[roomName].count === 0 ||
        rooms[roomName].people === undefined ||
        rooms[roomName].people.length == 0
      ) {
        rooms[roomName] = undefined;
      }
    }
  };

  socket.on('setName', (name) => {
    const oldName = clientName;
    clientName = name;
    if (!!rooms[inRoomName]) {
      rooms[inRoomName].people = rooms[inRoomName].people.filter(
        (n) => n !== oldName
      );

      if (rooms[inRoomName].dj == oldName) {
        rooms[inRoomName].dj = clientName;
      }
      rooms[inRoomName].people.push(clientName);
      updateClientRoom();
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    notifyPluginsOfDisonnection(socket);
    leaveRoom(inRoomName, clientName);
  });

  socket.on('becomeDJ', ({ room, name }) => {
    console.log('Receiving DJ request from', name, 'in room', room);
    if (rooms[room]) {
      rooms[room]['dj'] = name;
      updateClientRoom();
    }
  });

  socket.on('joinRoom', ({ roomName, myName }) => {
    leaveRoom(inRoomName, myName);

    inRoomName = roomName;
    clientName = myName;
    console.log(
      'a client is requesting to join a room',
      roomName,
      'their name',
      clientName
    );

    socket.join(inRoomName);
    if (!rooms[inRoomName]) {
      rooms[inRoomName] = {
        count: 0,
        name: inRoomName,
        people: [],
        dj: clientName,
      };
    }
    rooms[inRoomName].people.push(clientName);
    rooms[inRoomName].count++;
    notifyPluginsOfJoinedRoom(socket, inRoomName);
    updateClientRoom();
  });

  socket.on('hostEvent', (msg) => {
    console.log('got event from host', msg.position, msg.name);
    io.to(inRoomName).emit('hostEvent', msg);
  });
});

io.on('connection', function (socket) {
  console.log('a user connected');
});

server.listen(port, function () {
  console.log(`listening on *:${port}`);
});
