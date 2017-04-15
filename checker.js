// checker.js
// checks the Twitter stream

const twitterAccount = 'londonpogomap';

// init project
const Twitter = require('twitter');
const geolib = require('geolib');
const request = require('request');
const Storage = require('node-storage');
const moment = require('moment'); moment.locale('en-GB');
const url = require('url');

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

function checkForPokemon() {
  var store = new Storage(process.env.STORAGE_FILE);

  var seen = store.get('seen');
  if (!seen) seen = [];

  var users = store.get('users');
  if (!users) {
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
      if (seen.includes(tweet.id)) {
        seenCount++;
        continue;
      }
      
      var href = getGoogleUrl(tweet);
      var coords = getGoogleUrlCoordinate(href);
      
      // parse out the bits we want
      var tweetText = tweet.text.replace(/https?:[^ ]+/ig, '').replace(/\[.+\]/ig, '').replace(/ +/ig, ' ').trim();
      
      console.log(tweetText);
      
      /*
      var expiryString = tweet.text.match(/until (\d\d:\d\d:\d\d[AP]M)/i);
      if (expiryString != null && expiryString.length > 1) {
        var expiry = moment(expiryString[1], 'hh:mm:ssA');
        
        if (expiry.isAfter()) {
          console.log(`Tweet has expired: ${tweetText}`);
          continue;
        }
      }
      */
      
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

        if (user.notifyUrl) {
          console.log(`  Notifying user ${user.userName}: ${messageText}`);

          request({
            url: user.notifyUrl,
            method: "POST",
            json: { 'value1': messageText }
          });
        }
      }
      
      // add the tweet to the "already seen" list
      seen.push(tweet.id);
      // remove any excess, as we only need to know the same as the number of tweets we are returned
      while (seen.length > tweets.length) seen.shift();
      // save it to the storage for persistence
      store.put('seen', seen);
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
  //checkForPokemon();
  setInterval(checkForPokemon, 60000);
  console.log("Started periodic checking");
}

module.exports = start;
