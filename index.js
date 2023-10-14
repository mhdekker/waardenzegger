const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let state = {
    currentScreen: 'screen1',
    screens: {
        screen1: {
            message: "Hello, this is Screen 1!",
            color: "blue"
        },
        screen2: {
            message: "Welcome to Screen 2!",
            color: "green"
        },
        screen3: {
            message: "You're viewing Screen 3!",
            color: "red"
        }
    }
};

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.emit('stateUpdate', state);
    
    socket.on('changeState', (newState) => {
        // Update global state and screen-specific state
        state = { ...state, ...newState, screens: { ...state.screens, ...newState.screens } };
        io.emit('stateUpdate', state);
    });

    socket.on('changeScreen', (screenName) => {
        // Update the current screen if it exists in state.screens
        if(state.screens[screenName]) {
            state.currentScreen = screenName;
            io.emit('stateUpdate', state);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

