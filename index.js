const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');
const AllPlugins = require('./plugins');

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);

const port = process.env.PORT || 4000;
const PUBLIC_ROOM_CHARACTER = '#';

let rooms = {};
let plugins = [];

const registerPlugins = (io) => {
  plugins = AllPlugins.map((Plugin) => new Plugin(io));
};

const notifyPluginsOfConnection = (socket) => {
  plugins.forEach((plug) => plug.connected(socket));
};

const notifyPluginsOfDisonnection = (socket) => {
  plugins.forEach((plug) => plug.disconnected(socket));
};

const notifyPluginsOfJoinedRoom = (socket, roomName) => {
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

  socket.on('becomeDJ', ({ room, name }, response) => {
    console.log('Receiving DJ request from', name, 'in room', room);
    if (rooms[room] && rooms[room].canDj) {
      rooms[room]['dj'] = name;
      updateClientRoom();
      response(true);
    } else {
      response(false);
    }
  });

  socket.on('joinRoom', ({ roomName, myName }) => {
    // Lets normalize the room name to not be case sensative
    roomName = roomName.toLowerCase();

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
      const isPublic =
        roomName.includes(PUBLIC_ROOM_CHARACTER) || roomName == 'lobby';

      rooms[inRoomName] = {
        count: 0,
        name: inRoomName,
        people: [],
        dj: clientName,
        public: isPublic,
        canDj: true,
      };
    }
    rooms[inRoomName].people.push(clientName);
    rooms[inRoomName].count++;
    notifyPluginsOfJoinedRoom(socket, inRoomName);
    updateClientRoom();
  });

  socket.on('hostEvent', (msg) => {
    console.log(
      `Music Sync: ${inRoomName} (dj: ${clientName}) - ${msg.name} by ${msg.artist} - @ ${msg.position}`
    );
    io.to(inRoomName).emit('hostEvent', msg);
  });
});

io.on('connection', function (socket) {
  console.log('a user connected');
});

app.get('/rooms', (req, res) => {
  let responseHTML = `<style>html{font-family: Helvetica} table {width: 100%; text-align: left;}</style>
  <h1>Public Rooms</h1><table><tr><th>Room</th><th>Number of People</th><th>DJ</th></tr>`;
  Object.values(rooms)
    .filter((r) => r && !!r.public)
    .forEach((r) => {
      responseHTML += `<tr><td>${r.name}</td><td>${r.people.length}</td><td>${r.dj}</td></tr>`;
    });
  responseHTML += '</table>';
  res.send(responseHTML);
});

app.get('/rooms.json', (req, res) => {
  res.json(
    Object.values(rooms)
      .filter((r) => r && !!r.public)
      .map((r) => {
        return {
          name: r.name,
          count: r.people.length,
          dj: r.dj,
        };
      })
  );
});

server.listen(port, function () {
  console.log(`listening on *:${port}`);
});
