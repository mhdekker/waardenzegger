const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { randomInt } = require('crypto');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let stateTimeout; 

let activeSensors = {};
let touchCheckTimeout = null;
let chosenOne;
let dillemaOption1;
let dillemaOption2;
let chosenDillema;

app.use(express.static('public'));

function runPythonScript() {
    const pythonProcess = spawn('sudo', ['python3', '/home/martijn/waardenzegger/handler.py']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
    });
}

// Optional: Explicitly set up route for node_modules if you need to serve files directly from it
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

function formatTextToArray(filePath) {
    // Read the file content
    const text = fs.readFileSync(filePath, 'utf8');

    // Split the text into an array of lines, then map each line to remove the numbers
    return text.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim());
}

const sentencesArray = formatTextToArray('public/assets/dilemmas/dillemas.txt');
console.log(sentencesArray); // This will output the array of sentences

function pickNewDilemmas() {
    dillemaOption1 = randomInt(1, 24); // randomInt is inclusive of the min and exclusive of the max
    do {
        dillemaOption2 = randomInt(1, 24);
    } while (dillemaOption1 === dillemaOption2);
    
    var dillemas = [dillemaOption1, dillemaOption2];

    io.emit('dillemas', dillemas);
    io.emit('dillemasText', sentencesArray);
    console.log("Dillema's set! " + dillemas);
}

// Call the function once to set the initial dilemmas
pickNewDilemmas();

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
            nextAction: 'timerTouch',  // A simulated sensor input triggers the next state
            timerDuration: 8000
            //nextAction: 'buttonPress'  // Defines what should trigger the next state
        },
        state3: {
            //De waardenzegger kiest 1 deelnemer uit om een dilemma te kiezen 
            name: 'state3',
            color: 'blue',
            ledAction: '1',
            text: 'Ik kies nu iemand uit...',
            nextAction: 'timer',       // Wait for a specified time before moving to the next state
            timerDuration: 5000        // 5 seconds
        },
        state4: {
            //Twee dillema's verschijnen, de uitgekozen persoon kiest er een
            name: 'state4',
            color: 'blue',
            text: 'Kies dillema',
            nextAction: 'buttonPressDillema'
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
            ledAction: '5',
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
        // state12: {
        //     //Zelf een dillema toevoegen!
        //     name: 'state12',
        //     color: 'blue',
        //     text: 'end',
        //     nextAction: 'buttonPress',       // Wait for a specified time before moving to the next state
        // },
        state12: {
            //Einde, bedankt
            name: 'state12',
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

    //check for timerTouch
    if (nextState.nextAction === 'timerTouch') {
        startTimerTouch();
    }

    if (nextState.ledAction === '1') {
        ledController.chooseParticipant(1);
    }

    if (nextState.ledAction === '5') {
        ledController.chooseParticipant(5);
    }

    // Immediately update the current state and inform all clients
    state.currentState = nextStateName;
    io.emit('stateUpdate', nextState);

    console.log(`Transitioned to: ${nextStateName}`);

    // If the next state uses a timer, prepare the transition that comes after the timer
    if (nextState.nextAction === 'timer' && nextState.timerDuration) {
        setTimeout(() => {
            const nextStateAfterTimer = getNextStateName(nextStateName);
            stateTransition(nextStateName, nextStateAfterTimer);
        }, nextState.timerDuration);
    }

    // Reset the global timeout every time a state transition occurs
    clearTimeout(stateTimeout);  // Clear any existing timeout
    if (nextStateName !== 'state1') { 
        stateTimeout = setTimeout(() => {
            stateTransition(state.currentState, 'state0');  // Transition to state0 after 90 seconds
        }, 90000);  // Set new timeout for 90 seconds
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
        console.error("Next state does not exist, going back to 1");
        return 'state1'; // going back to the start'
    }
}

function startTimerTouch() {
    touchCheckTimeout = setTimeout(() => {
        // After 15 seconds, decide the next state based on sensors touched
        checkSensorsAfterTime();
        // Call the function once to set the initial dilemmas
    }, 15000);  // 15 seconds
}

function checkSensorsAfterTime() {
    const touchedSensorsCount = Object.keys(activeSensors).length;

    // Build the sensor touch status array
    const sensorsStatus = [];
    for (let i = 0; i <= 3; i++) {
        sensorsStatus[i] = activeSensors[i] ? 1 : 0;
    }

    // Log the sensor touch status
    console.log(`Sensor touch status: [${sensorsStatus.join(', ')}]`);

    // Decide the next state based on the number of sensors touched
    if (touchedSensorsCount <= 1) {
        stateTransition(state.currentState, 'state1');
    } else {
        stateTransition(state.currentState, getNextStateName(state.currentState));
    }

    // Reset the touch check state
    activeSensors = {};
    touchCheckTimeout = null;
}

io.on('connection', (socket) => {
    // Send the initial state
    socket.emit('stateUpdate', state.states[state.currentState]);

    // Listen for a button press and move to the next state if applicable
    socket.on('buttonPress', () => {
        stateTransition(state.currentState, getNextStateName(state.currentState));
    });

    socket.on('touch_event', (data) => {
        // Now you can use data.sensor_id and data.state
        if (data.state === 'touched') {
            console.log(`Sensor ${data.sensor_id} was touched`);
            // Add your logic here
        } else if (data.state === 'untouched') {
            console.log(`Sensor ${data.sensor_id} was untouched`);
            // Add logic to handle the sensor being untouched
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + 'public/index.html');
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
    runPythonScript();  // This will start the Python script
});

