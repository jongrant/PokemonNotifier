// server.js
// runs the web API

// init project
const express = require('express');
const bodyParser = require('body-parser')
const db = require('diskdb'); 
  db.connect('.data/', ['users']);

// set up a web endpoint to listen for messages
var app = express();
  app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.status(200).send("OK");
});

app.get('/user/:user', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var user = db.users.findOne({ userName: req.params.user });
  
  if (user != null) {
    res.status(200).json(user);
  }
  else {
    res.status(404).send('Not found');
  }
});

app.post('/user/:user', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  if (!req.body.notifyUrl && !req.body.notifySms) {
    res.status(400).send('Missing parameter: notifyUrl or notifySms');
    return;
  }
  
  var user = db.users.findOne({ userName: req.params.user });
  
  if (user == null) {
    user = { 
      userName: req.body.user, 
      notifyUrl: req.body.notifyUrl, 
      notifySms: req.body.notifySms 
    };

    db.users.save(user);
    
    res.status(200).send("OK");
    console.log(`Registered user ${user.userName}, notifyUrl ${user.notifyUrl}, notifySms ${user.notifySms}`);
  }
  else {
    res.status(400).send('User exists');
  }
});

app.put('/user/:user', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var query = { userName: req.params.user };
  var user = db.users.findOne(query);
  
  if (user != null) {
    if (req.body.notifySms) user.notifySms = req.body.notifySms;
    if (req.body.notifyUrl) user.notifyUrl = req.body.notifyUrl;
    db.users.update(query, user, { multi: false, upsert: false });

    res.status(200).send('OK');
    console.log(`Updated user ${user.userName}, set notifyUrl = ${user.notifyUrl}, notifySms = ${user.notifySms}`);
  }
  else {
    res.status(404).send('Not found');
  }
});

app.get('/user/:user/location', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var user = db.users.findOne({ userName: req.params.user });
  
  if (user != null) {
    res.status(200).json(user.location); 
  }
  else {
    res.status(404).send('Not found');
  }
});

app.put('/user/:user/location', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  if (!req.body.longitude) {
    res.status(400).send('Missing parameter: longitude');
    return;
  }
  
  if (!req.body.latitude) {
    res.status(400).send('Missing parameter: latitude');
    return;
  }
  
  var query = { userName: req.params.user };
  var user = db.users.findOne(query);
  
  if (user != null) {
    user.location.latitude = parseFloat(req.body.latitude.toString().trim());
    user.location.longitude = parseFloat(req.body.longitude.toString().trim());
    db.users.update(query, user, { multi: false, upsert: false });

    res.status(200).send('OK');
    console.log(`Updated user ${user.userName}, set location = ${user.location.latitude}, ${user.location.longitude}`);
  }
  else {
    res.status(404).send('Not found');
  }
});

app.get('/user/:user/ignore', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }
  
  var user = db.users.findOne({ userName: req.params.user });
  
  if (user != null) {
    if (!user.ignore) user.ignore = [];
    res.status(200).json(user.ignore); 
  }
  else {
    res.status(404).send('Not found');
  }
});

app.get('/user/:user/ignore/:name', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }

  if (!req.params.name) {
    res.status(400).send('Missing parameter: name');
    return;
  }
  
  var user = db.users.findOne({ userName: req.params.user });
  var name = req.params.name.toLowerCase();
  
  if (user != null) {
    if (!user.ignore) user.ignore = [];

    var isIgnored = user.ignore.includes(name);
    res.status(200).json({ value: isIgnored ? 'yes' : 'no' } ); 
  }
  else {
    res.status(404).send('Not found');
  }
});

app.post('/user/:user/ignore/:name', function (req, res) {
  if (!req.params.user) {
    res.status(400).send('Missing parameter: user');
    return;
  }

  if (!req.params.name) {
    res.status(400).send('Missing parameter: name');
    return;
  }

  if (!req.body.value) {
    res.status(400).send('Missing parameter: value');
    return;
  }

  if (req.body.value !== 'yes' && req.body.value !== 'no') {
    res.status(400).send("Value must be 'yes' or 'no'");
    return;
  }
  
  var query = { userName: req.params.user };
  var user = db.users.findOne(query);
  var name = req.params.name.toLowerCase();
  
  if (user != null) {
    if (!user.ignore) user.ignore = [];

    if (req.body.value == 'no') {
      user.ignore = user.ignore.filter(i => i !== name);
    }
    else if (req.body.value == 'yes') {
      user.ignore.push(name);
    }

    res.status(200).send('OK');
    db.users.update(query, user, { multi: false, upsert: false });
  }
  else {
    res.status(404).send('Not found');
  }
});

function start() {
  app.listen(process.env.HTTP_PORT, function () {
    console.log(`Web app listening on port ${process.env.HTTP_PORT}`);
  });
}

module.exports = start;