const settings = require("./settings.json");
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const messages = require("./messages.json");

client.login(settings.token);

client.on("ready", ready =>{
    console.log("Ready");
})

client.on("messageReactionAdd", (msgReact, user) =>{
    let ind = getMessage(msgReact.message.id);
    if(ind === -1 || msgReact.emoji.name !== "✅" || user.bot) return;
    msgReact.message.guild.createChannel(user.username, {type : "text",parent : settings.category, permissionOverwrites : [
            {
                id : user.id,
                allow : "READ_MESSAGES"
            }
        ]});
})

client.on("message", msg =>{
    let com = msg.content.toLowerCase().split(' ')[0];
    if(com === settings.prefix + "setcategory" && msg.member.hasPermission("ADMINISTRATOR")){
        //setcategory categoryId
        let args = msg.content.split(' ');
        if(!args[1]) return;
        let ch = msg.guild.channels.get(args[1]);
        if(!ch) return;
        settings.category = ch.id;
        fs.writeFile("settings.json", JSON.stringify(settings, ' ', 2), function(err){
            if(err) console.log(err);
        })
    }
    if(com === settings.prefix + "createmsg" && msg.member.hasPermission("ADMINISTRATOR")){
        if(!settings.category) return;
        //createmsg msg
        let mes = '';
        let args = msg.content.split(' ');
        if(!args[1]) return;
        for(let i = 1; i < args.length; i++){
            mes += args[i];
            if(i !== args.length - 1) return;
        }
        msg.channel.send(mes).then(mess =>{
            mess.react("✅");
            msg.delete();
            messages.messages.push({
                id : mess.id
            })
            fs.writeFile("messages.json", JSON.stringify(messages, ' ', 2), function(err){
                if(err) console.log(err);
            });
        })
    }
    if(com === settings.prefix + "delticket" && msg.member.hasPermission("ADMINISTRATOR")){
        //delticket
        if(msg.channel.parentID === settings.category){
            msg.channel.delete();
        }
    }
    if(com === settings.prefix + "c" && msg.member.hasPermission("ADMINISTRATOR")){
        //c
        if(msg.channel.parentID === settings.category){
            msg.channel.overwritePermissions(msg.guild.id, {READ_MESSAGES : false}).then(() =>{
                msg.delete();
            });
        }
    }
})

function getMessage(id){
    for(let i = 0; i < messages.messages.length; i++){
        if(id === messages.messages[i].id){
            return i;
        }
    }
    return -1;
}

client.on("raw", packet => {
    if (!["MESSAGE_REACTION_ADD"].includes(packet.t)) return;
    const channel = client.channels.get(packet.d.channel_id);

    if (channel.messages.has(packet.d.message_id)) return;
    channel.fetchMessage(packet.d.message_id).then(message => {
        const emoji = packet.d.emoji.id
            ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
            : packet.d.emoji.name;
        const reaction = message.reactions.get(emoji);
        if (packet.t === "MESSAGE_REACTION_ADD") {
            client.emit(
                "messageReactionAdd",
                reaction,
                client.users.get(packet.d.user_id)
            );
        }
    });
});