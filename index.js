const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);

const port = process.env.PORT || 4000;

let rooms = {};

io.on('connection', socket => {
  let inRoomName = '';
  let clientName = '';

  const updateClientRoom = () => {
    console.log('sendng room event', rooms[inRoomName]);
    io.to(inRoomName).emit('roomEvent', rooms[inRoomName]);
  };

  console.log('a user connected');

  socket.on('setName', name => {
    const oldName = clientName;
    clientName = name;
    if (!rooms[inRoomName] && !!oldName) {
      rooms[inRoomName].people = rooms[inRoomName].people.filter(
        n => n !== oldName
      );
      rooms[inRoomName].people.push(name);
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
    if (rooms[inRoomName]) {
      console.log('removing', clientName);
      rooms[inRoomName].people = rooms[inRoomName].people.filter(
        n => n !== clientName
      );
      rooms[inRoomName].count--;
      io.to(inRoomName).emit('roomEvent', rooms[inRoomName]);
      console.log('rooms', rooms[inRoomName]);
    }
  });

  socket.on('joinRoom', ({ roomName, myName }) => {
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
      };
    }
    rooms[inRoomName].people.push(clientName);
    rooms[inRoomName].count++;

    updateClientRoom();
  });

  socket.on('hostEvent', msg => {
    console.log('got event from host', msg.position);
    console.log('to room', inRoomName);
    io.to(inRoomName).emit('hostEvent', msg);
  });
});

io.on('connection', function(socket) {
  console.log('a user connected');
});

server.listen(port, function() {
  console.log(`listening on *:${port}`);
});
