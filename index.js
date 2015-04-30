// START HEROKU SETUP
var express = require("express");
var app = express();
app.get('/', function(req, res){ res.send('The Guild Ball Plots bot is running.'); });
app.listen(process.env.PORT || 5000);
// END HEROKU SETUP


// config
//
// Config.keys uses environment variables so sensitive info is not in the repo.
var config = {
    me: 'GuildBallPlots', // The authorized account with a list to retweet
    keys: {
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    },
};

// A hash containg the season 1 plots and a count of
// how many times each has been selected. since last
// restart
var plotLog = {
    'Vengeance': 0,
    'Man Marking': 0,
    'Make A Game Of It!': 0,
    'Knee Slider!': 0,
    'Miraculous Recovery': 0,
    'Keep Ball': 0,
    'Man Down': 0,
    'Sideline Repairs': 0,
    'Dont Touch The Hair!': 0,
    'Second Wind': 0,
    'Who Are Ya?': 0,
    'Protect Your Balls': 0
};

// A hash containg the season 1 plots
var seasonOnePlots = [
    'Vengeance',
    'Man Marking',
    'Make A Game Of It!',
    'Knee Slider!',
    'Miraculous Recovery',
    'Keep Ball',
    'Man Down',
    'Sideline Repairs',
    'Dont Touch The Hair!',
    'Second Wind',
    'Who Are Ya?',
    'Protect Your Balls'
];

function getPlots() {

    // clone the plots array
    var plotsCpy = _.clone(seasonOnePlots);
    var plotText = ' Plots: ';
    var idx = 0;
    var i = 0;

    do {
        // get a random index for the plots array
        idx = Math.floor((Math.random() * plotsCpy.length));

        // add the plot to the returned string
        plotText = plotText + plotsCpy[idx];
        if (i < 4) {
            plotText = plotText + ', ';
        }
        
        // log the selection of the plot
        plotLog[plotsCpy[idx]]++;

        // remove the plot we have just added
        plotsCpy.splice(idx, 1);

        i++;
    }
    while (i < 5);

    return plotText;
}

function getTweetText(player) {
    return '@' + player + getPlots();
}

function printPlotLog() {
    console.log(JSON.stringify(plotLog, null, 4));
}

function reply(tweet) {
    
    twitter.post('statuses/update', {
        status: getTweetText(tweet.user.screen_name),
        in_reply_to_status_id: tweet.id_str
    }, onTweet);

    var firstMentioned;

    _.find(tweet.entities.user_mentions, function(user) {
        if (user.screen_name !== config.me) {
            firstMentioned = user.screen_name;
        }
    });

    if (firstMentioned !== undefined) {
        twitter.post('statuses/update', {
            status: getTweetText(firstMentioned)
        }, onTweet);
    }

    printPlotLog();
}

// What to do after we retweet something.
function onTweet(err, tweet, response) {
    if(err) {
        console.error("tweet failed to send :(");
        console.error(err);
    }
    else {
        console.log(tweet.text);
    }
}

// What to do when we get a tweet.
function triageTweet(tweet) {
    // Reject the tweet if:
    //  1. it's flagged as a retweet    
    if (tweet.retweeted) {
        return;
    }
    else {
        // Send a tweet to the person that requested the plots
        reply(tweet);
    }
}

// Function for listening to twitter streams for mentions.
function startStream() {

    twitter.stream('statuses/filter', {
        track: config.me
    }, function(stream) {
        console.log("listening to stream for " + config.me);
        stream.on('data', triageTweet);
    });
}

// An instance of underscore.
var _ = require('underscore');

// The application itself.
// Use the node-twitter (twitter) node module to get access to twitter.
var twitter = require('twitter')(config.keys);

// Run the application. 
startStream();
