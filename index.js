(function() {
  var Discord, chan, client, config, err, error, exid, gid;

  Discord = require('discord.js');

  client = new Discord.Client();

  try {
    config = require('toml').parse(require('fs').readFileSync("./config.toml"));
  } catch (error1) {
    error = error1;
    console.error("Could not read ./config.toml. Please copy the sample config to config.toml!");
    process.exit(1);
  }

  gid = config.guild;

  chan = config.channel;

  exid = config.executor;

  err = (function() {
    switch (false) {
      //when not exid? then "Please provide the user ID of the executor of the bans."
      case !(gid == null):
        return "Please provide the guild ID of the affected guild.";
      case !(chan == null):
        return "Please provide a channel to send the affected users list.";
    }
  })();

  if (err) {
    console.log(err);
    process.exit(1);
  }

  client.on('ready', async function() {
    var alogs, blogs, guild, id, log, mesg, presentMembers, psize, x;
    guild = client.guilds.get(gid != null ? gid : "0");
    if (guild == null) {
      console.error("Guild not found.");
      process.exit(1);
      return;
    }
    ({
      entries: alogs
    } = (await guild.fetchAuditLogs({
      type: "MEMBER_BAN_ADD"
    })));
    ({
      entries: blogs
    } = (await guild.fetchAuditLogs({
      type: "MEMBER_KICK"
    })));
    alogs = alogs.concat(blogs);
    psize = alogs.size;
    alogs = exid != null ? alogs.filter((v, i) => {
      return v.executor.id === exid;
    }) : alogs;
    presentMembers = [];
    for (x of alogs) {
      [id, log] = x;
      if (((await (async function() {
        try {
          return (await guild.fetchMember(log.target.id));
        } catch (error1) {}
      })())) != null) {
        presentMembers.push(log.target.id);
        console.log(`User ${log.target.username}#${log.target.discriminator} is presently in the guild.`);
      }
    }
    alogs = alogs.filter((v, i) => {
      return !presentMembers.includes(v.target.id);
    });
    console.log(`Found ${alogs.size} out of ${psize} matching logs.`);
    console.log("List of bans:");
    alogs.forEach(function(v, i) {
      var lstr;
      lstr = `${v.executor.id} - ${v.executor.username}#${v.executor.discriminator}`;
      lstr += ` ${(v.action === "MEMBER_BAN_ADD" ? "banned" : "kicked")} ${v.target.id}`;
      lstr += ` - ${v.target.username}#${v.target.discriminator}`;
      return console.log(lstr);
    });
    mesg = `There were ${alogs.size} out of ${psize} bans or kicks which matched the given executor,`;
    mesg += " and the targets weren't present in the guild. Here they are:\n";
    alogs.forEach(function(v, i) {
      mesg += `<@${v.target.id}> was ${(v.action === "MEMBER_BAN_ADD" ? "banned" : "kicked")}`;
      return mesg += ` by ${v.executor.username}.\n`;
    });
    mesg += "This bot is brought to you by tphecca. PLEASE APPRECIATE ME I LOVE IT";
    if (config.executor != null) {
      await guild.channels.get(chan).send(mesg, {
        split: {
          char: "\n"
        }
      });
    }
    return process.exit(0);
  });

  client.login(config.token);

}).call(this);
