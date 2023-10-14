const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let counter = 0;

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.emit('counterUpdate', counter);
    
    socket.on('incrementCounter', () => {
        counter++;
        io.emit('counterUpdate', counter);
    });
    
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
