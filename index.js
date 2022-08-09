const { Client, Intents } = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');
const ytdl = require('ytdl-core');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const queue = new Map();


client.once('ready', function(){
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('?help');
    console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});


client.once('disconnect', () => {
  console.log('Disconnect!');
});




client.on("message", async function(message){
    if (message.author.bot) return;

    if(message.content === "hi"){
        message.reply("Hey :)");
    }

    if (!message.content.startsWith(prefix)) return;
    
    const serverQueue = queue.get(message.guild.id);

    if(message.content.startsWith(`${prefix}help`)){
      message.channel.send("*?play url*, *?skip*, *?stop*")
      return
    }
    
    if (message.content.startsWith(`${prefix}play`)) {
      playMusic(message, serverQueue);
      return;

    } else if (message.content.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      return;

    } else if (message.content.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      return;
    } 
  });
  
  async function playMusic(message, serverQueue) {
    const args = message.content.split(" ");
    const voiceChannel = message.member.voice.channel;
    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!voiceChannel)
      return message.channel.send(
        "Voice channel is empty"
      );
    
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "Not enough permissions to speak in the voice channel"
      );
    }
    songInfo = await ytdl.getInfo(args[1]);
    
    const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
     };

    
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  }
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel){
      return;
    }
      
    if (!serverQueue){
      return
    }
      
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel){
      return;
    }
      
    if (!serverQueue){
      return;
    }
      
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now playing: **${song.title}**`);
  }
  
  client.login(token);
