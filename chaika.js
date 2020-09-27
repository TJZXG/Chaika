const Discord = require('discord.js');
const client = new Discord.Client();
const version = require('./package.json').version;
const tzdata = require('./node_modules/moment-timezone/data/meta/latest.json');
const botSecretToken = process.env.botSecretToken;
console.log("Running version " + version);
var moment = require('moment-timezone');


client.on('ready', () => {
    console.log("Connected as " + client.user.tag);
    richPresence();
});

// Get your bot's secret token from: https://discordapp.com/developers/applications/
client.login(botSecretToken);

// Send alert to check GW defense on Sundays
function sundayReminder() {
    var reminderTime = moment(11, "HH"); // Reminder start time
    var reminderTimeEnd = moment(12, "HH"); // Do not send reminder after this time 
    // Check every hour if current time is between reminder start time and end time. Send reminder if true
    if (moment().isBetween(reminderTime, reminderTimeEnd, undefined, '[]') == true) {
        client.channels.cache.get("561730202561150978").send("<@&733159915849252945>, make sure Guild War Defense is set!")
        console.log('Guild War reminder sent at: ' + moment());
    } else {
        // Prevent any further execution of sundayReminder as soon as Monday rolls around
        if (moment().day() == 1) {
            return;
        }
        setTimeout(sundayReminder, 3600000);
    }
}

// Only execute sundayReminder on Sundays
if (moment().day() == 0) {
    sundayReminder();
}

client.on('message', msg => {
    // Prevent bot from responding to itself
    if (msg.author == client.user) {
        return;
    }
    // Accept messages that start with c! or C! as command
    if (msg.content.startsWith("c!") || msg.content.startsWith("C!")) {
        command(msg);
    }
    if (msg.content.startsWith("Happy birthday") || msg.content.startsWith("happy birthday")) {
        birthday(msg);
    }
});

function command(msg) {
    let fullCommand = msg.content.substr(2).toLowerCase(); // Remove c! and set to lower case
    let splitCommand = fullCommand.split(" ");
    let primaryCommand = splitCommand[0]; // First word after c! is the command, rest are arguments
    let cmdArguments = splitCommand.slice(1); // cmdArguments may be empty - check for this if accessing it
    console.log(msg.member.user + msg.member.user.tag + " sent command " + primaryCommand);
    console.log(msg.member.user + msg.member.user.tag + " sent arguments " + cmdArguments);

    if (primaryCommand == "version") {
        msg.reply("The current version is " + version);
    } else if (primaryCommand == "help") {
        helpCommand(cmdArguments, msg);
    } else if (primaryCommand == "time") {
        timeCommand(cmdArguments, msg);
    } else if (primaryCommand == "timezones") {
        timezoneCommand(cmdArguments, msg);
    } else if (primaryCommand == "timer") {
        timerCommand(cmdArguments, msg);
    } else if (primaryCommand == "gearcalc" || "autism") {
        msg.reply("I bless you with Eff Res or a min roll <:mldab2:713127647521013783>\nhttps://meowyih.github.io/epic7-gear/index.html?lang=en");
    }
}

function timezoneCommand(cmdArguments, msg) {
    if (cmdArguments[0] == null) {
        msg.reply("Please specify a `Country`, or `Country/City!`");
        return;
        /* Too many zone names start with America in the timezone dataset, even for those of other countries.
         Directly point to America timezone object from json */
    } else if (cmdArguments[0] == "america" || cmdArguments[0] == "us" || cmdArguments[0] == "usa") {
        msg.reply("Timezones for America: " + tzdata.countries.US.zones);
        return;
    } else {
        // moment.tz is case sensitive on Country and City inputs
        filterSplit = cmdArguments[0].toString().split("/");
        if (typeof filterSplit[1] == 'undefined') {
            filterName = filterSplit[0].toString().charAt(0).toUpperCase() + filterSplit[0].toString().slice(1); // If only a country is given, the filter is the capitalized country name
        } else {
            countryUpper = filterSplit[0].toString().charAt(0).toUpperCase() + filterSplit[0].toString().slice(1);
            cityUpper = filterSplit[1].toString().charAt(0).toUpperCase() + filterSplit[1].toString().slice(1);
            filterName = countryUpper + "/" + cityUpper; // Filter is capitalized "Country/City"
        }
        const timezoneList = moment.tz.names();
        function countryFilter(country) {
            return country.startsWith(filterName);
        }
        let timezone = timezoneList.filter(countryFilter);
        if (timezone == null) {
            msg.reply("I could not find anything for the Country or Country/City you specified. Please make sure the country and city names are capitalized as this query is case sensitive.");
            return;
        } else {
            msg.reply("First 20 cities/timezones available for " + filterName + ":\n" + timezone.slice(0, 20)); // Only display first 20 due to 2000 character limit on Discord API
            return;
        }
    }
}

function helpCommand(cmdArguments, msg) {
    const cmdList = "c!help: You already know what this does!\n" +
        "c!version: Checks the bot version\n" +
        "c!time: Timezone conversions\n" +
        "c!timezones: Check the timezone name for your country/city\n" +
        "c!gearcalc: Gear Potential Calculator\n" +
        "c!timer: Set a timer\n";

    if (cmdArguments.length == 0) {
        msg.reply("The list of commands available is: \n" + cmdList + "\nPlease use c!help <command> to check a particular command's syntax.");
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "version") {
        msg.reply("Shows the bot's current running version. Mostly for testing right after deployment.")
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "time") {
        msg.reply("c!time <time in hh:mm> <origin timezone city> <target timezone city>. Timezone names supported (like UTC, MST) but not DST aware.\nEx: c!time 8:00 UTC America/Denver");
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "timezones") {
        msg.reply("c!timezones <country> or <country/city> will show you valid timezone names for your country or country/city to use with c!time\nEx: c!timezones Australia\nc!timezones America/Denver");
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "timer") {
        msg.reply("c!timer <##h##> to set a reminder when timer will run out. The hour must be specified, minute is optional. Ex: c!timer 8h30, c!timer 0h45, c!timer 8h");
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "gearcalc") {
        msg.reply("Link for Gear Potential Calculator");
    } else {
        msg.channel.send("I don't know anything about that ¯\\_(ツ)_/¯");
    }
}

function timeCommand(cmdArguments, msg) {
    // Check to make sure the command is not missing any arguments
    if (typeof cmdArguments[0] == 'undefined') {
        msg.reply("Please input a time!");
        return;
    } else if (typeof cmdArguments[1] == 'undefined') {
        msg.reply("Please input the source timezone / location");
        return;
    } else if (typeof cmdArguments[2] == 'undefined') {
        msg.reply("Please input the target timezone / location");
        return;
    } else {
        timeCheck = cmdArguments[0].split(":");
        hour = parseInt(timeCheck[0]);
        minute = parseInt(timeCheck[1]);
        if (hour < 0 || hour > 23) {
            msg.reply("Make sure hour is between 0 and 23");
            return;
        } else if (minute < 0 || minute > 59) {
            msg.reply("Make sure minute is between 0 and 59");
            return;
        } else if (hour == null || minute == null) {
            msg.reply("Make sure time input is valid HH:mm");
            return;
        } else {
            moment.tz.setDefault(cmdArguments[1]);
            sourceTime = moment.tz(moment({ "hour": hour, "minute": minute }), cmdArguments[1].toString()); // Create a moment with arguments from user command. cmdArguments[1] is source timezone
            hourSource = moment(sourceTime).hour().toString();
            // Pad with a leading 0 if h or m in hh:mm is below 10
            if (hourSource.length == 1) {
                hourSource = hourSource.padStart(2, '0');
            }
            minuteSource = moment(sourceTime).minutes().toString();
            if (minuteSource.length == 1) {
                minuteSource = minuteSource.padStart(2, '0');
            }
            moment.tz.setDefault(cmdArguments[2]);
            targetTime = moment(sourceTime).tz(cmdArguments[2].toString());
            hourTarget = moment(targetTime).hour().toString();
            if (hourTarget.length == 1) {
                hourTarget = hourTarget.padStart(2, '0');
            }
            minuteTarget = moment(targetTime).minutes().toString();
            if (minuteTarget.length == 1) {
                minuteTarget = minuteTarget.padStart(2, '0');
            }
            output = "The time " + hourSource + ":" + minuteSource + " in " + cmdArguments[1].toString() + " is " + hourTarget + ":" + minuteTarget + " in " + cmdArguments[2].toString();
            msg.channel.send(output);
            msg.channel.send("Times look strange? One or both of your timezone names probably doesn't exist in the database. Check c!timezones and c!help timezones");
            return;
        }
    }
}

function timerCommand(cmdArguments, msg) {
    // Check to make sure the command is not missing any arguments
    if (typeof cmdArguments[0] == 'undefined') {
        msg.reply("Please input a time in the format of ##h##! Ex: 18h30, 8h, 0h20");
        return;
    } else {
        let timeArray = cmdArguments[0].split("h");
        let timerHour = parseInt(timeArray[0]);
        let timerMinute = parseInt(timeArray[1]);
        if (timerHour < 0 || timerHour > 99999) {
            msg.reply("I'll be dead by then!");
            return;
        } else if (timerMinute < 0 || timerMinute > 59) {
            msg.reply("Make sure minute is between 0 and 59");
            return;
        } else if (timerHour == null && timerMinute == null) {
            msg.reply("Make sure time input is valid ##h##. Ex: 18h30, 8h, 0h35");
            return;
        } else {
            msg.channel.send("I'll remind you in " + cmdArguments[0] + " that time's up!")
            let countdownMs = (timerHour * 60 + timerMinute) * 60 * 1000
            setTimeout(reminder, countdownMs);
            function reminder() {
                msg.reply("Time's up!");
                return;
            }
        }
    }
}

// Bonus
function birthday(msg) {
    msg.reply("Mubashir says you're welcome.")
}

function richPresence() {
    var presentActivity = [
        { "name": "with Javascript", "type": "PLAYING" },
        { "name": "with world lines", "type": "PLAYING" },
        { "name": "Sekiro on Easy Mode", "type": "PLAYING" },
        { "name": "Skynet", "type": "LISTENING" },
        { "name": "hard bass", "type": "LISTENING" },
        { "name": "eurobeat", "type": "LISTENING" },
        { "name": "you like a fiddle", "type": "PLAYING" },
        { "name": "you while you sleep", "type": "WATCHING" },
        { "name": "loading screens", "type": "WATCHING" },
        { "name": "communist propaganda", "type": "WATCHING" }
    ];
    presenceIndex = Math.floor(Math.random() * presentActivity.length);
    client.user.setActivity(presentActivity[presenceIndex].name, { type: presentActivity[presenceIndex].type });
}

setInterval(richPresence, 300000); // Change rich presence every 5 minutes

// Get your bot's secret token from: https://discordapp.com/developers/applications/
client.login(botSecretToken);