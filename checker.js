// checker.js
// checks the Twitter stream

const twitterAccount = 'londonpogomap';

// init project
const Twitter = require('twitter');
const geolib = require('geolib');
const request = require('request');
const sms = require('node-fastsms');
const db = require('diskdb'); 
  db.connect('.data/', ['users', 'seen']);
const moment = require('moment'); 
  moment.locale('en-GB');
const url = require('url');

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// db.seen.remove();
// sms.sendOne("447872023503", "Test message", "Pokemon Go");

function checkForPokemon() {
  var users = db.users.find();
  if (users.length == 0) {
    console.log("No users found.");
    return;
  }
  console.log(`Loaded ${users.length} users`);

  console.log("Performing check...");
  getTweets(twitterAccount, function(error, tweets, response) {
    if (error) {
      console.log(error);
      return;
    }
    
    console.log(`Retrieved ${tweets.length} tweets`);
    var seenCount = 0;
    
    for (var i = 0; i < tweets.length; i++) {
      var tweet = tweets[i];
      
      // don't reparse any tweet we already looked at
      if (db.seen.findOne({ tweet_id: tweet.id })) {
        seenCount++;
        continue;
      }
      
      var href = getGoogleUrl(tweet);
      var coords = getGoogleUrlCoordinate(href);
      
      // parse out the bits we want
      var tweetText = tweet.text.replace(/https?:[^ ]+/ig, '').replace(/\[.+\]/ig, '').replace(/ +/ig, ' ').trim();
      
      console.log(tweetText);
      
      for (var j = 0; j < users.length; j++) {
        var user = users[j];
        
        // work out the distance
        var dist = geolib.getDistance(user.location, coords);
        var distFormat = dist + 'm';
        if (dist > 1000) distFormat = (dist / 1000.0) + 'km';
          
        // work out what direction it's in
        var direction = geolib.getCompassDirection(user.location, coords);
        
        // add our extra information plus the URL to the message
        var messageText = `${tweetText} (${distFormat} away, ${direction.exact}) ${href.href}`; 
        
        if (dist > user.range) {
          console.log(`  User ${user.userName} is too far away (${distFormat})`);
          continue;
        }

        if (user.notifySms) {
          console.log(`  Notifying user ${user.userName} via SMS: ${messageText}`);

          sms.sendOne(user.notifySms, messageText, process.env.SMS_FROM);
        }
        else if (user.notifyUrl) {
          console.log(`  Notifying user ${user.userName} via HTTP: ${messageText}`);

          request({
            url: user.notifyUrl,
            method: "POST",
            json: { 'value1': messageText }
          });
        }
      }
      
      // add the tweet to the "already seen" list
      db.seen.save({ tweet_id: tweet.id });
    }
    
    if (seenCount > 0) console.log(`Already seen ${seenCount} of them`);
  });
}

function getTweets(account, callback) {
  var params = { screen_name: account };
  twitterClient.get('statuses/user_timeline', params, callback);
}

function getGoogleUrl(tweet) {
  for (var i = 0; i < tweet.entities.urls.length; i++) {
    var obj = tweet.entities.urls[i];
    var parsed = url.parse(obj.expanded_url, true);
    if (parsed.hostname == 'maps.google.com') return parsed;
  }
  
  return null;
}

function getGoogleUrlCoordinate(href) {
  var split = href.query['q'].split(',');
  return { latitude: parseFloat(split[0]), longitude: parseFloat(split[1]) };
}

function start() {
  // start checking  
  setInterval(checkForPokemon, 60000);
  console.log("Started periodic checking");
  
  checkForPokemon();
}

module.exports = start;
