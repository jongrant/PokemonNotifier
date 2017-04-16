// main.js
// starts the different components

const dotenv = require('dotenv');
  dotenv.load();

const checker = require('./checker');
const server = require('./server');

checker();
server();

