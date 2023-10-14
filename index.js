const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const CapSenseHandler = require('./capSenseHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const capSenseHandler = new CapSenseHandler();

app.use(express.static('public'));

let state = {
    currentState: 'state1',
    states: {
        state0: {
            //Time out
            name: '0 - Timed out',
            color: 'blue',
            text: 'Start screen',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state1: {
            //Het start/wacht scherm voordat de experience begint. 
            name: 'state1',
            color: 'blue',
            text: 'Start screen',
            nextAction: 'buttonPress'  // Defines what should trigger the next state
        },
        state2: {
            //Deelnemers leggen hun handen op de sensoren, er wordt gegekeken wie er mee doen. 
            name: 'state2',
            color: 'blue',
            text: 'Leg je hand op de paarse hand voor je',
            nextAction: 'sensorTouch'  // A simulated sensor input triggers the next state
        },
        state3: {
            //De waardenzegger kiest 1 deelnemer uit om een dilemma te kiezen 
            name: 'state3',
            color: 'blue',
            text: '',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 5000        // 5 seconds
        },
        state4: {
            //Twee dillema's verschijnen, de uitgekozen persoon kiest er een
            name: 'state4',
            color: 'blue',
            text: 'end',
            nextAction: 'buttonPress'
        },
        state5: {
            //Beargumenteer de keuze voor het dilemma
            name: 'state5',
            color: 'blue',
            text: 'end',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
        },
        state6: {
            //Participanten worden gevraagt om aan de waardenschijf te draaien. 
            name: 'state6',
            color: 'blue',
            text: 'end',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state7: {
            //Bekijk de waardenschijf
            name: 'state7',
            color: 'blue',
            text: 'end',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state8: {
            //Is de gekozen waarde met het dillema positief of negatief?
            name: 'state8',
            color: 'blue',
            text: 'end',
            nextAction: 'buttonPress',   
        },
        state9: {
            //Er wordt opnieuw een participant gekozen
            name: 'state9',
            color: 'blue',
            text: 'end',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 5000        // 5 seconds
        },
        state10: {
            //Vraag: Wie zijn er bij betrokken?
            name: 'state10',
            color: 'blue',
            text: 'end',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state11: {
            //Vraag: Wie zijn er bij betrokken?
            name: 'state11',
            color: 'blue',
            text: 'end',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state12: {
            //Zelf een dillema toevoegen!
            name: 'state12',
            color: 'blue',
            text: 'end',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
        },
        state13: {
            //Einde, bedankt
            name: 'state13',
            color: 'blue',
            text: 'end',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        }
    }
};

const stateTransition = (currentStateName, nextStateName) => {
    const nextState = state.states[nextStateName];

    if (!nextState) {
        console.error(`Invalid next state: ${nextStateName}`);
        return;
    }

    state.currentState = nextStateName;

    // Emit new state to all connected clients
    io.emit('stateUpdate', nextState);

    // Handle timer transitions
    if (nextState.nextAction === 'timer' && nextState.timerDuration) {
        setTimeout(() => {
            // Recursively transition to the next state after timer duration
            stateTransition(nextStateName, getNextStateName(nextStateName)); // define the function to get the name of the next state based on current state
        }, nextState.timerDuration);
    }
};

function getNextStateName(currentStateName) {
    // Extract the number from the currentStateName
    const currentStateNumber = parseInt(currentStateName.replace('state', ''), 10);
    
    // Create the next state's name by incrementing the number
    const nextStateName = 'state' + (currentStateNumber + 1);
    
    // Ensure the next state exists, otherwise loop back or handle error
    if (state.states[nextStateName]) {
        return nextStateName;
    } else {
        console.error("Next state does not exist, staying in current state");
        return currentStateName; // or return to a specific state like 'state0'
    }
}

io.on('connection', (socket) => {
    // Send the initial state
    socket.emit('stateUpdate', state.states[state.currentState]);

    // Listen for a button press and move to the next state if applicable
    socket.on('buttonPress', () => {
        stateTransition(state.currentState, getNextStateName(state.currentState));
    });

    //Listen for a sensor touch and move to the next state if applicable
    capSenseHandler.on('sensorActivated', (sensorId) => {
        console.log('Received sensorActivated on client', sensorId);

        if(state.currentState === 'state2') {
            state.currentState = 'state3';
            io.emit('stateUpdate', state.states[state.currentState]);
            
            // Move to state 4 after 5 seconds
            setTimeout(() => {
                state.currentState = 'state4';
                io.emit('stateUpdate', state.states[state.currentState]);
            }, state.states[state.currentState].timerDuration);
        }
    });

    socket.on('simulateSensorActivation', (sensorId) => {
        console.log("Received: simulateSensorActivation");
        capSenseHandler.activateSensor(sensorId);
    });

});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

