import { Player, world } from "@minecraft/server"
import { PlayerConfig, ChatMessage } from "./types"
import { hash } from "better-auth"
export type ChatHash = {
    hash : string
}

export let chatHashes : ChatHash[] = [{hash: "9fcdb1fe-60a8-4de0-9cd8-66b7a6c45830"}]
let people : string[] = [];


export let chatHistory = new Map<string, ChatMessage[]>();


export const generateChatHash =  (people: string[]): string => {
    const sorted = [...people].sort();
    const input = sorted.join('|');
    let h1 = 5381;
    let h2 = 52711;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        h1 = ((h1 << 5) + h1 + c) | 0; //h1 * 33 + c
        h2 = ((h2 << 5) - h2 + c) | 0; //h2 * 31 + c(a different constant on purpose)
    }

    // >>> 0 convrts the signed int back to unsigned before hex,
    // so you never get a "-" in the output
    const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
    const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");

    return hex1 + hex2; // always exactly 16 hex characters
}
//configuraton
export const getPlayerConfig = (player: Player) : PlayerConfig => {
    const raw = player.getDynamicProperty("echo:player_config") as string | undefined;
    if(!raw){
        // return sensible default defaults if nothing is saved
        return {current_menu: 0, chat_hash: "" } as PlayerConfig;
    }
    return JSON.parse(raw) as PlayerConfig;

}
export const setPlayerConfig = (player: Player, config: Partial<PlayerConfig>) => {
    const existing: PlayerConfig = getPlayerConfig(player);
    const updated: PlayerConfig = {...existing,...config};
    player.setDynamicProperty("echo:player_config", JSON.stringify(updated));
}
export function getAllPlayers() : string []{
    people = [];
    let players: Player[] = world.getAllPlayers();
    players.forEach(player => {
        people.push(player.name);
    });
    people.push("bacon_lord");
    return people;
}
export function setInvitedPlayer(player : Player, invite : string){
        const existing: PlayerConfig = getPlayerConfig(player);
        const existingPlayers : string[] = existing.invitedPlayers;
        existingPlayers.push(invite);
    setPlayerConfig(player, {invitedPlayers: existingPlayers});

}
export function getInvitedPlayers(player : Player) : string []{
    
    const config : PlayerConfig = getPlayerConfig(player);
    return config.invitedPlayers;
}
//Chat Data functions
export function getChatHashes() : string[]{
    return JSON.parse(world.getDynamicProperty("echo:all_chat_hashes") as string);
}
export function tryStoreChatHash(chatHash: string){
    const hashes : string[] = getChatHashes();
    
    for(let i = 0; i < hashes.length; i++){
        if(hashes[i] === chatHash){
            console.warn("Invited this friend already!");
            return;
        }
    }
    hashes.push(chatHash);
    world.setDynamicProperty("echo:all_chat_hashes", JSON.stringify(hashes));
}

export function findChatHash(people: string[]):string{
    let result : string = "";
let hash: string = generateChatHash(people);
    getChatHashes().forEach(storedHash => {
        if(hash === storedHash){
            console.warn("Hash: ", hash, "Stored Hash: ", storedHash);
            result = storedHash;
        }
    })
    return result;
}

export function resetHashes(){
    world.setDynamicProperty("echo:all_chat_hashes", JSON.stringify([]));

}

export function setPlayerChats(player: Player){
    let worldChatHashes = world.getDynamicProperty("echo:all_chats_chashes");

}


export function getChatHistory(chatHash : string) : ChatMessage[]{

    return chatHistory.get(chatHash) ?? [];
}

export function setInChatHistory(chatHash : string, message : ChatMessage){
    const existing : ChatMessage[] = getChatHistory(chatHash);
    existing.push(message);
    chatHistory.set(chatHash, existing);
}

export function cachePlayersChats(player: Player, people: string[]){
    let chatMap : Map<string, ChatMessage[]> = new Map();

    let config = getPlayerConfig(player);
    findChatHash(config.invitedPlayers);
    config.invitedPlayers.forEach(p => {
        let temp_hash = findChatHash([...people, player.name]);
        let chatMessages : ChatMessage[] = getChatHistory(temp_hash);

        chatMap.set(temp_hash, chatMessages);
    })
    setPlayerConfig(player, {cache: chatMap});
}
export function getCachedPlayersChats(player: Player){
    const hashes = getChatHashes();
    let config : PlayerConfig = getPlayerConfig(player);
    hashes.forEach(hash => {
        if(config.cache.has(hash)){
            if(getChatHistory(hash)[getChatHistory(hash).length - 1].index <= config.cache.get(hash)[config.cache.get(hash).length].index ){
                chatHistory.set(hash, config.cache.get(hash) ?? []);
            }
        }
    })

    config.cache.clear();
}