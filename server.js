// server.js
// runs the web API

// init project
const express = require('express');
const db = require('diskdb'); 
  db.connect('.data/', ['users']);

// set up a web endpoint to listen for messages
var app = express();

app.get('/user/get', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var user = db.users.findOne({ userName: req.query.user });
  
  if (user != null) {
    res.status(200).send(user);
  }
  else {
    res.status(404).send('Not found');
  }
});

app.get('/user/register', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  if (!req.query.notifyUrl) {
    res.status(400).send('Missing parameter: notifyUrl');
    return;
  }
  
  var user = db.users.findOne({ userName: req.query.user });
  
  if (user == null) {
    user = { userName: req.query.user, range: 1500, notifyUrl: req.query.notifyUrl };
    db.users.save(user);
    
    res.status(200).send("OK");
    console.log(`Registered user ${user.userName}, notifyUrl ${user.notifyUrl}`);
  }
  else {
    res.status(400).send('User exists');
  }
});

app.get('/notify/set', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  if (!req.query.notifyUrl && !req.query.notifySms) {
    res.status(400).send('Missing parameter: notifyUrl or notifySms');
    return;
  }
  
  var query = { userName: req.query.user };
  var user = db.users.findOne(query);
  
  if (user != null) {
    user.notifySms = req.query.notifySms;
    user.notifyUrl = req.query.notifyUrl;
    db.users.update(query, user, { multi: false, upsert: false });

    res.status(200).send('OK');
    console.log(`Updated user ${user.userName}: notifyUrl = ${user.notifyUrl}, notifySms = ${user.notifySms}`);
    return;    
  }
  
  res.status(404).send('Not found');
  return;
});

app.get('/location/get', function (req, res) {
  if (!req.query.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var user = db.users.findOne({ userName: req.query.user });
  
  if (user != null) {
    res.status(200).send(user.location); 
  }
  else {
    res.status(404).send('Not found');
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
  
  var query = { userName: req.query.user };
  var user = db.users.findOne(query);
  
  if (user != null) {
    user.location.latitude = parseFloat(req.query.latitude.trim());
    user.location.longitude = parseFloat(req.query.longitude.trim());
    db.users.update(query, user, { multi: false, upsert: false });

    res.status(200).send('OK');
    console.log(`Updated user ${user.userName} location to ${user.location.latitude}, ${user.location.longitude}`);
    return;
  }
  
  res.status(404).send('Not found');
  return;
});

function start() {
  app.listen(3000, function () {
    console.log('Web app listening on port 3000')
  });
}

module.exports = start;