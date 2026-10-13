import { Player, system, world } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui"
import { buildChatViewForm } from "./ChatView"
import { ChatMessage, PlayerConfig } from "./types"
import * as db from "./PlayerDatabase"

export function ShowChatList(player : Player){
    const chatListForm = new ActionFormData()
    .title("echo:ChatList");

    const people : string[] = db.getInvitedPlayers(player);
    
        if(!people || people.length === 0){
            player.sendMessage("No chats. Invite someone to chat using !invite name");
        }
    people.forEach(person => { 
        if(player.name != person){
            chatListForm.button(person, "textures/items/apple");
        }
    });

    chatListForm.show(player as Player).then(da => {
        if(da.canceled)
        {
            db.setPlayerConfig(player, {current_menu: 0});
            system.waitTicks(1);
            return;
        }
        db.setPlayerConfig(player, {current_menu: 1, chat_hash: db.findChatHash([player.name, people[da.selection as number]]).trim()});
        console.warn("Params: ", player.name, ", ", people[da.selection as number]);
        console.warn("Set the Hash: ", db.getPlayerConfig(player).chat_hash);
        buildChatViewForm(player, "Katadash5634", db.getChatHistory(db.getPlayerConfig(player).chat_hash));
    })
}