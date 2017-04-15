// server.js
// runs the web API

// init project
const express = require('express');
const Storage = require('node-storage');

// set up a web endpoint to listen for messages
var app = express();

app.get('/user/get', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var store = new Storage(process.env.STORAGE_FILE);
  var users = store.get('users');
  
  for (var j = 0; j < users.length; j++) {
    var user = users[j];
    if (user.userName == req.query.user) {
      res.status(200).send(user);
      return;
    }
  }
  
  res.status(404).send('Not found');
  return;
});

app.get('/notify/set', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  if (!req.query.notifyUrl) {
    res.status(400).send('Missing parameter: notifyUrl');
    return;
  }
  
  var store = new Storage(process.env.STORAGE_FILE);
  var users = store.get('users');
  
  for (var j = 0; j < users.length; j++) {
    if (users[j].userName == req.query.user) {
      users[j].notifyUrl = req.query.notifyUrl;
      
      store.put('users', users);
      
      res.status(200).send('OK');
      console.log(`Updated user ${users[j].userName} notifyUrl to ${users[j].notifyUrl}`);
      return;
    }
  }
  
  res.status(404).send('Not found');
  return;
});

app.get('/location/get', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var store = new Storage(process.env.STORAGE_FILE);
  var users = store.get('users');
  
  for (var j = 0; j < users.length; j++) {
    var user = users[j];
    if (user.userName == req.query.user) {
      res.status(200).send(user.location);
      return;
    }
  }
});

app.get('/location/set', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  if (!req.query.longitude) {
    res.status(400).send('Missing parameter: longitude');
    return;
  }
  
  if (!req.query.latitude) {
    res.status(400).send('Missing parameter: latitude');
    return;
  }
  
  var store = new Storage(process.env.STORAGE_FILE);
  var users = store.get('users');
  
  for (var j = 0; j < users.length; j++) {
    if (users[j].userName == req.query.user) {
      users[j].location.latitude = parseFloat(req.query.latitude.trim());
      users[j].location.longitude = parseFloat(req.query.longitude.trim());
      store.put('users', users);
      
      res.status(200).send('OK');
      console.log(`Updated user ${users[j].userName} location to ${users[j].location.latitude},${users[j].location.longitude}`);
      return;
    }
  }
});

function start() {
  app.listen(3000, function () {
    console.log('Web app listening on port 3000')
  });
}

module.exports = start;