import { world, system, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { buildChatViewForm } from "./ChatView";
import { ShowChatList } from "./ChatList";
import { ChatMessage } from "./types"
import * as db from "./PlayerDatabase";

world.afterEvents.itemUse.subscribe(data => {
    const player = data.source;
    const item = data.itemStack;

    if(item.typeId === "minecraft:stick"){
        db.setPlayerConfig(player, {chat_hash: "first_hash"});
    }

    if(item.typeId === "minecraft:iron_ingot"){
        if(db.getPlayerConfig(player).current_menu === 0)
            ShowChatList(player);
        else if(db.getPlayerConfig(player).current_menu === 1)
            buildChatViewForm(player, "Katadash5634", db.getChatHistory(db.getPlayerConfig(player).chat_hash));
    }
});
world.beforeEvents.playerInteractWithEntity.subscribe(data => {
    const player = data.player;
    const entity = data.target;

    if(entity.typeId === "minecraft:pig"){
    console.warn("Hello Piggyo");
       db.setInChatHistory(db.getPlayerConfig(player).chat_hash, {person: "Bacon", message: "Oink!", index: db.getChatHistory(db.getPlayerConfig(player).chat_hash).length});
               console.warn("Chat Hash: ", JSON.stringify(db.getPlayerConfig(player)));
               console.warn("Chats: ", JSON.stringify(db.getChatHistory(db.getPlayerConfig(player).chat_hash)));
    // db.setInChatHistory(db.getPlayerConfig(player).chat_hash, {person: "Bacon Lord", message: "Oink", index:db.getChatHistory(db.getPlayerConfig(player).chat_hash).length})
    }
    // }
})

world.beforeEvents.chatSend.subscribe(data => {
    const msg = data.message;
    const player = data.sender;
    let outputName : string = "";
    if (data.cancel)
        return;
    if (msg.startsWith("!invite")) {
        outputName = msg.split(" ")[1];
        console.warn("InvitedPlayer: ", outputName);
        let hash = db.generateChatHash([player.name, outputName]);
        console.warn("Hash: ", hash);
        db.tryStoreChatHash(hash);
        db.setInvitedPlayer(player, outputName);
        console.warn("INVITED PLAYERS: ", db.getInvitedPlayers(player));
        console.warn(JSON.stringify(db.getChatHashes()));
        return;
    }

    // save player chats and data
    if (msg.startsWith("!save")) {
        db.saveChatHistory();
    }
    
        if (msg.startsWith("!clchat")) {
        db.resetHashes();
        console.warn(JSON.stringify(db.getChatHashes()));
        db.setPlayerConfig(player, { chat_hash: "", current_menu: 0, invitedPlayers: [] });
        console.warn(JSON.stringify(db.getPlayerConfig(player)));
    }
})

world.afterEvents.playerSpawn.subscribe((data) => {
    const player = data.player;
    const init = data.initialSpawn;

    if(init){
    }    
})


world.beforeEvents.playerLeave.subscribe((data) => {
    const player = data.player;
    console.warn("Caching Player Chats");
    db.saveChatHistory();
})

world.afterEvents.worldLoad.subscribe(data => {
   db.cacheChatHistory(); 
});

system.beforeEvents.startup.subscribe(ev => {
    let echo_chat_init : boolean = world.getDynamicProperty("echo_chat:init") as boolean ?? false;
    if(echo_chat_init === undefined || echo_chat_init === false){
        console.warn("ECHO CHAT INIT:", echo_chat_init);
        //Setup

        world.setDynamicProperty("echo_chat:init", true);
    }
    console.warn("ECHO CHAT INIT:", echo_chat_init);

})

system.beforeEvents.shutdown.subscribe(ev => {
    db.saveChatHistory();
})