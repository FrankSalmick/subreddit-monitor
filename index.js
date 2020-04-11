'use strict';

let request = require('request');
let util    = require('util');
let _       = require('lodash');
let readline= require('readline');
let open    = require('open');

const FG_GREEN = "\x1b[32m";
const FG_WHITE = "\x1b[37m";
const FG_CYAN = "\x1b[36m"

const REDDIT_INFO = {
    subreddits: [
        {
            r: 'mechmarket',
            regex: ".*",
            description: 'Watch for new posts'
        }
    ],
    topNewPostsUrl: 'https://www.reddit.com/r/%s/new.json?sort=new',
};
REDDIT_INFO.subreddits.forEach(subreddit =>
    subreddit.url = util.format(REDDIT_INFO.topNewPostsUrl, subreddit.r)); 

const USER_AGENT = 'node:com.minicl55.subredditWCLI v1.0 (by /u/minicl55)'

let subreddit2Matches = 
    _.reduce(REDDIT_INFO.subreddits, (result, subreddit) => {
        result[subreddit.r] = [/* { id: 'abc123', timestamp: 123456789 } */]
        return result;
    }, {});

let checkForNewMatches = (subreddits, loggingEnabled) => {
    clearStaleMatches(subreddit2Matches);

    subreddits.forEach(subreddit => {
        request({
            url: subreddit.url,
            headers: { 'User-Agent': USER_AGENT }
        }, (err, response, body) => {

            if (!err && response.statusCode === 200) {
                try {
                    let json = JSON.parse(body);
                    let data = json.data;

                    _.get(json, 'data.children', []).forEach(child => {
                        let id        = _.get(child, 'data.id', '');
                        let title     = _.get(child, 'data.title', '');
                        let permalink = _.get(child, 'data.permalink', '');


                        if (title.match(subreddit.regex) != null) {
                            if (!_.find(subreddit2Matches[subreddit.r], o => o.id === id)) {
                                subreddit2Matches[subreddit.r].push({
                                    id: id,
                                    timestamp: (new Date()).getTime()
                                });
                                printNotification(subreddit, { title: title, permalink: permalink }, loggingEnabled); 
                            }
                        }
                    });
                } catch (exception) {
                    console.error(`Error parsing JSON for body=${body}`);
                    console.error(exception);
                }
            }
        });
    });
};


// Todo make this not a global
// Honestly this band aid exists because I am just too lazy to do it the right way (scan through the subreddit2Matches object, maybe make a stack of references to the objects, idk. I'll figure it out later.)
// I'll do it eventually but right now I just want this to work.
var lastLink;
let printNotification = (subreddit, matchingPost, loggingEnabled) => {
    if (!loggingEnabled) return;
    printTime();
    lastLink = "https://reddit.com" + matchingPost.permalink;
    console.log(" New post in " + FG_CYAN + "/r/" + subreddit.r + ": " + FG_GREEN + _.unescape(matchingPost.title) + FG_WHITE);
    console.log(lastLink);
}

let printTime = () => {
    var time = new Date();
    process.stdout.write(FG_WHITE + "[" + FG_CYAN + time.getHours() % 12 + ":" + time.getMinutes() + FG_WHITE + "]");
}

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
const TTL = ONE_WEEK;
let clearStaleMatches = matches => {
    let now = (new Date()).getTime();

    Object.keys(matches).forEach(subreddit => {
        _.remove(matches[subreddit], match => now - match.timestamp > TTL);
    });
};

// listen to keypresses from the user
const keyResponses = {
    "h": () => {
        console.log("h: Print this menu\no: Open the most recent URL\ns: Print subreddits and their properties\nc: Clear the screen\nq: Quit");
    }, 
    "o": () => {
        if (lastLink == null) {
            console.log("No link found.")
        } else {
            open(lastLink);
        }
    },
    "s": () => {
        console.log(REDDIT_INFO.subreddits);
    },
    "c": () => {
        console.clear();
    },
    "q": () => {
        process.exit(0);
    }
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    var functionToRun = keyResponses[str];
    if (functionToRun != undefined) {
        functionToRun();
    } else {
        console.log(str + " is not a valid option. Press h for help.")
    }
});
// Don't log to the screen while we build the list of posts we've already seen
checkForNewMatches(REDDIT_INFO.subreddits, false);
setInterval(() => checkForNewMatches(REDDIT_INFO.subreddits, true), 1000*60*.5);
// make all text white instead of grey
console.log(FG_WHITE + "Ready, monitoring " + Object.keys(REDDIT_INFO.subreddits).length + " subreddits. Press h for a list of commands.");