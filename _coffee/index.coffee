Discord = require('discord.js')
client = new Discord.Client()

try
  config = require('toml').parse(require('fs').readFileSync("./config.toml"))
catch error
  console.error("Could not read ./config.toml. Please copy the sample config to config.toml!")
  process.exit(1)
gid = config.guild
chan = config.channel
exid = config.executor

err = switch
  #when not exid? then "Please provide the user ID of the executor of the bans."
  when not gid? then "Please provide the guild ID of the affected guild."
  when not chan? then "Please provide a channel to send the affected users list."

if err then console.log(err); process.exit(1)

client.on 'ready', ->
  guild = client.guilds.get(if gid? then gid else "0")
  if not guild?
    console.error("Guild not found.")
    process.exit(1); return
  {entries: alogs} = await guild.fetchAuditLogs(type: "MEMBER_BAN_ADD")
  {entries: blogs} = await guild.fetchAuditLogs(type: "MEMBER_KICK")
  alogs = alogs.concat(blogs)
  psize = alogs.size
  alogs = if exid? then alogs.filter((v, i) => v.executor.id is exid) else alogs
  presentMembers = []
  for [id, log] from alogs
    if (try await guild.fetchMember(log.target.id))?
      presentMembers.push(log.target.id)
      console.log("User #{log.target.username}##{log.target.discriminator} is presently in the guild.")
  alogs = alogs.filter((v, i) => not presentMembers.includes(v.target.id) )
  console.log("Found #{alogs.size} out of #{psize} matching logs.")
  console.log("List of bans:")
  alogs.forEach (v, i) ->
    lstr = "#{v.executor.id} - #{v.executor.username}##{v.executor.discriminator}"
    lstr += " #{if v.action is "MEMBER_BAN_ADD" then "banned" else "kicked"} #{v.target.id}"
    lstr += " - #{v.target.username}##{v.target.discriminator}"
    console.log(lstr)
  mesg = "There were #{alogs.size} out of #{psize} bans or kicks which matched the given executor,"
  mesg += " and the targets weren't present in the guild. Here they are:\n"
  alogs.forEach (v, i) ->
    mesg += "<@#{v.target.id}> was #{if v.action is "MEMBER_BAN_ADD" then "banned" else "kicked"}"
    mesg += " by #{v.executor.username}.\n"
  mesg += "This bot is brought to you by tphecca. PLEASE APPRECIATE ME I LOVE IT"
  if config.executor? then await guild.channels.get(chan).send(mesg, {split: {char: "\n"}})
  process.exit(0)

client.login(config.token)
