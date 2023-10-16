const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const CapSenseHandler = require('./capSenseHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const capSenseHandler = new CapSenseHandler();

let stateTimeout; 

app.use(express.static('public'));

let state = {
    currentState: 'state1',
    states: {
        state0: {
            //Time out
            name: 'state0',
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
            text: 'Ik kies nu iemand uit...',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 5000        // 5 seconds
        },
        state4: {
            //Twee dillema's verschijnen, de uitgekozen persoon kiest er een
            name: 'state4',
            color: 'blue',
            text: 'Kies dillema',
            nextAction: 'buttonPress'
        },
        state5: {
            //Beargumenteer de keuze voor het dilemma
            name: 'state5',
            color: 'blue',
            text: 'Beargumenteer de keuze',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
        },
        state6: {
            //Participanten worden gevraagt om aan de waardenschijf te draaien. 
            name: 'state6',
            color: 'blue',
            text: 'Draai aan de schijf',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state7: {
            //Bekijk de waardenschijf
            name: 'state7',
            color: 'blue',
            text: 'Bekijk de waarde voor je',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 5 seconds
        },
        state8: {
            //Is de gekozen waarde met het dillema positief of negatief?
            name: 'state8',
            color: 'blue',
            text: 'Is de gekozen waarde met het dillema positief of negatief?',
            nextAction: 'buttonPress',   
        },
        state9: {
            //Er wordt opnieuw een participant gekozen
            name: 'state9',
            color: 'blue',
            text: 'Ik kies nu weer iemand uit...',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 5000        // 5 seconds
        },
        state10: {
            //Vraag: Hoe ga je met dit dillema om?
            name: 'state10',
            color: 'blue',
            text: 'Hoe ga je met dit dillema om',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 10 seconds
        },
        state11: {
            //Vraag: Wie zijn er bij betrokken?
            name: 'state11',
            color: 'blue',
            text: 'Wie zijn er bij dit dillema vertrokken',
            nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
            timerDuration: 10000        // 10 seconds
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
            timerDuration: 10000        // 10 seconds
        }
    }
};

const stateTransition = (currentStateName, nextStateName) => {
    const nextState = state.states[nextStateName];

    if (!nextState) {
        console.error(`Invalid next state: ${nextStateName}`);
        return;
    }

    // Immediately update the current state and inform all clients
    state.currentState = nextStateName;
    io.emit('stateUpdate', nextState);

    console.log(`Transitioned to: ${nextStateName}`);

    // If the next state uses a timer, prepare the transition that comes after the timer
    if (nextState.nextAction === 'timer' && nextState.timerDuration) {
        setTimeout(() => {
            const nextStateAfterTimer = getNextStateName(nextStateName);
            console.log('Timer elapsed, transitioning to:', nextStateAfterTimer);
            stateTransition(nextStateName, nextStateAfterTimer);
        }, nextState.timerDuration);
    }

    // Reset the global timeout every time a state transition occurs
    clearTimeout(stateTimeout);  // Clear any existing timeout
    stateTimeout = setTimeout(() => {
        console.log('90s timeout elapsed, transitioning to: state0');
        stateTransition(state.currentState, 'state0');  // Transition to state0 after 90 seconds
    }, 90000);  // Set new timeout for 90 seconds
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
        console.error("Next state does not exist, going back to 1");
        return 'state1'; // going back to the start'
    }
}

io.on('connection', (socket) => {
    // Send the initial state
    socket.emit('stateUpdate', state.states[state.currentState]);
    console.log('Start: Server emitted stateUpdate:', state.states[state.currentState]);

    // Listen for a button press and move to the next state if applicable
    socket.on('buttonPress', () => {
        console.log('buttonPress: Server emitted stateUpdate to:', getNextStateName(state.currentState));
        stateTransition(state.currentState, getNextStateName(state.currentState));
    });

    capSenseHandler.on('sensorActivated', (sensorId) => {
        console.log('3 - Got it! Sensor: ', sensorId);
        const currentState = state.states[state.currentState];

        // Check if the current state expects a sensor activation for transitioning
        if (currentState.nextAction === 'sensorTouch') {
            console.log('4 - Transition from: ', currentState, ' to: ', getNextStateName(state.currentState));
            stateTransition(state.currentState, getNextStateName(state.currentState));
        }
    });
    
    socket.on('simulateSensorActivation', (sensorId) => {
        console.log("1 - Simulated sensor activation for sensor", sensorId);
        capSenseHandler.activateSensor(sensorId);
    });

});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

