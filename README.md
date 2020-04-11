Monitors any subreddit for new posts, checking whether their titles match a stored regex. If the regex is matched, a message is printed to the screen

Someone else used this to monitor /r/churning for the lucrative AMEX Platinum Card deal. I used this to monitor /r/mechmarket

This is pretty similar to the version I forked, except that this outputs data to the screen instead of emailing it, and has a few other small utilities (like opening the most recent link). Press h at any time the program is focused to see a list of commands.

Launch with `node index.js` or `npm start` from the command line (both ways require you to install [node.js](https://nodejs.org/en/download/))

npm packages requried: `npm i lodash util request open readline`