const Discord = require('discord.js');
const client = new Discord.Client();
const version = require('./package.json').version;
const botSecretToken = process.env.botSecretToken;
console.log("Running version " + version);
var moment = require('moment-timezone');
const cmdList = "c!help: You already know what this does!\n" +
    "c!version: Checks the bot version\n" +
    "c!time: Timezone conversions\n" +
    "c!timezones: Check the timezone name for your country/city\n"

client.on('ready', () => {
    console.log("Connected as " + client.user.tag);
    richPresence();
});

client.on('message', msg => {
    // Prevent bot from responding to itself
    if (msg.author == client.user) {
        return;
    }

    if (msg.content.startsWith("c!")) {
        command(msg);
    }
});

function command(msg) {
    let fullCommand = msg.content.substr(2); // Remove c!
    let splitCommand = fullCommand.split(" ");
    let primaryCommand = splitCommand[0];
    let cmdArguments = splitCommand.slice(1); // cmdArguments may be empty
    console.log(msg.member.user + msg.member.user.tag + " sent command " + primaryCommand);
    console.log(msg.member.user + msg.member.user.tag + " sent arguments " + cmdArguments);

    if (primaryCommand == "version") {
        msg.reply("The current version is " + version);
    } else if (primaryCommand == "help") {
        helpCommand(cmdArguments, msg);
    } else if (primaryCommand == "time") {
        timeCheck = cmdArguments[0].split(":");
        hour = parseInt(timeCheck[0]);
        minute = parseInt(timeCheck[1]);
        if (hour < 0 || hour > 23) {
            msg.reply("Make sure hour is between 0 and 23");
            return;
        } else if (minute < 0 || minute > 59) {
            msg.reply("Make sure minute is between 0 and 59");
            return;
        }
        else if (hour == null || minute == null) {
            msg.reply("Make sure time input is valid HH:mm");
            return;
        } else {
            timeCommand(cmdArguments, msg, hour, minute);
        }
    } else if (primaryCommand == "timezones") {
        // Total list of all timezone entries is longer than 2000 lines and results in unhandled Promise rejection
        if (cmdArguments[0] == null) {
            msg.reply("Please specify a `country`, or `country/city!`");
            return;
        } else {
            const timezoneList = moment.tz.names();
            function countryFilter(country) {
                return country.startsWith(cmdArguments[0]);
            }
            let timezone = timezoneList.filter(countryFilter);
            if (timezone == null) {
                msg.reply("I could not find anything for the country or country/city you specified");
                return;
            } else {
                msg.reply("First 20 cities/timezones available for " + cmdArguments[0] + ":\n" + timezone.slice(0, 20));
                return;
            }
        }
    }
    else {
        msg.reply("I don't know that command! Try c!help");
    }
}

function helpCommand(cmdArguments, msg) {
    if (cmdArguments.length == 0) {
        msg.reply("The list of commands available is: \n" + cmdList + "\nPlease use c!help <command> to check a particular command's syntax.");
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "time") {
        msg.reply("c!time <time in hh:mm> <origin timezone city> <target timezone city>. Limited support for timezone names (like UTC, MST).\nEx: c!time 8:00 UTC America/Denver");
    } else if (cmdArguments.length > 0 && cmdArguments[0] == "timezones") {
        msg.reply("c!timezones <country> or <country/city> will show you valid timezone names for your country or country/city to use with c!time\nEx: c!timezones Australia\nc!timezones America/Denver");
    } else {
        msg.channel.send("I don't know anything about that ¯\\_(ツ)_/¯");
    }
}

function timeCommand(cmdArguments, msg, hour, minute) {
    console.log(cmdArguments);
    console.log(hour);
    console.log(minute);
    moment.tz.setDefault(cmdArguments[1]);
    sourceTime = moment.tz(moment({"hour": hour, "minute": minute}), cmdArguments[1].toString()); // Create a moment with arguments from user command. cmdArguments[1] is source timezone
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
    console.log(hourSource);
    console.log(minuteSource);
    console.log(hourTarget);
    console.log(minuteTarget);

    output = "The time " + hourSource + ":" + minuteSource + " in " + cmdArguments[1].toString() + " is " + hourTarget + ":" + minuteTarget + " in " + cmdArguments[2].toString();
    msg.channel.send(output);
    msg.channel.send("If the data seems strange one of your input timezones probably doesn't exist in the database. Try c!timezones to check")
    return;
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
    console.log("Next index :" + presenceIndex);
    client.user.setActivity(presentActivity[presenceIndex].name, { type: presentActivity[presenceIndex].type });
}

setInterval(richPresence, 300000); // Change rich presence every 5 minutes

// Get your bot's secret token from: https://discordapp.com/developers/applications/
client.login(botSecretToken);