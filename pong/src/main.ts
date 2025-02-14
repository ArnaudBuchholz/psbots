import { Game } from './Game.js';
import { start } from './renderer.js';

const game = new Game();
game.setup();
start(game);
