const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = SocketIO(server);

let rooms = {};

io.on('connection', socket => {
  let inRoomName = '';
  let myName = '';

  const updateClientRoom = () => {
    console.log('sendng room event', rooms[inRoomName]);
    io.to(inRoomName).emit('roomEvent', rooms[inRoomName]);
  };

  console.log('a user connected');

  socket.on('setName', name => {
    const oldName = myName;
    myName = name;
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
      rooms[inRoomName].people = rooms[inRoomName].people.filter(
        n => n !== myName
      );
      rooms[inRoomName].count--;
      io.to(inRoomName).emit('roomEvent', rooms[inRoomName]);
    }
  });

  socket.on('joinRoom', ({ roomName, myName }) => {
    inRoomName = roomName;
    console.log('a client is requesting to join a room', roomName);

    socket.join(inRoomName);
    if (!rooms[inRoomName]) {
      rooms[inRoomName] = {
        count: 0,
        name: inRoomName,
        people: [],
      };
    }
    rooms[inRoomName].people.push(myName);
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

server.listen(3000, function() {
  console.log('listening on *:3000');
});