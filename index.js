import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import Game from './game.js';
import fs from 'fs';
import authRouter from './src/routers/authRouter.js'
const words = JSON.parse(fs.readFileSync('./words.json'));

const PORT = process.env.PORT || 3000;
const origin = process.env.ORIGIN;
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin } });
app.use(express.static('public'));
app.use(authRouter);
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', origin);
  next();
});
app.get('/random-word', (_, res) => {
  res.json(words[Math.floor(Math.random() * words.length)]);
});

class Player {
  constructor(name, id) {
    this.id = id;
    this.name = name;
  }
}

/** @type {Player[]} */
let players = [];

/** @type {Game} */
let game;

const newWord = () => {
  if (!game) {
    console.log('new game');
    game = new Game(words[Math.floor(Math.random() * words.length)]);
  }
}

/** @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket */
const update = (socket) => {
  const player = players.find(e => e.id == socket.id);
  io.emit('update', {
    worldLength: game.word.value.length,
    errors: game.errors,
    usedLetters: game.usedLetters,
    correctLetters: game.correctLetters,
    result: game.isWin() ? `Jogador: ${player.name} venceu!` : game.isEnd() ? 'Fim do jogo!' : null
  });
  if (game.isEnd()) {
    game = null;
    io.disconnectSockets();
  }
}

/** @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket */
const onGuess = (socket) => {
  socket.on('guess', letter => {
    if (letter.length != 1 || !isNaN(letter)) {
      return socket.disconnect();
    }
    const player = players.find(e => e.id == socket.id);
    if (player) {
      console.log(`player: ${player.name} send: ${letter}`);
    }
    game.useLetter(letter);
    update(socket);
  });
}

/**  @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket */
const onDisconnect = (socket) => {
  socket.on('disconnect', () => {
    const player = players.find(e => e.id == socket.id);
    if (player) {
      console.log(`player: ${player.name} disconnected`);
      players = players.filter(e => e.id != socket.id);
    }
    if (game && !game.isEnd()) {
      console.log('update players');
      const playerNames = players.map(({ name }) => name);
      io.emit('playerDisconnect', playerNames);
    }
    if (players.length == 0) {
      game = null;
    }
  });
}

/**  @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket */
const onJoin = (socket) => {
  socket.on('join', (name, callback) => {
    const player = new Player(name, socket.id);
    console.log(`player: ${name} connected`);
    players.push(player);
    const playerNames = players.map(({ name }) => name);
    callback({ players: playerNames, length: game.word.value.length, hint: game.word.hint, usedLetters: game.usedLetters, errors: game.errors, correctLetters: game.correctLetters });
    socket.broadcast.emit('newPlayerJoin', playerNames);
  });
}

io.engine.on('connection', e => {
  e.request = null
})

io.on('connection', socket => {
  newWord();
  onJoin(socket);
  onDisconnect(socket);
  onGuess(socket);
});

server.listen(PORT);