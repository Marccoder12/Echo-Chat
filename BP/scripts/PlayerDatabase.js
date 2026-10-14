import { world } from "@minecraft/server";
let people = [];
export let chatHistory = new Map();
export const generateChatHash = (people) => {
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
};
//configuraton
export const getPlayerConfig = (player) => {
    const raw = player.getDynamicProperty("echo:player_config");
    if (!raw) {
        // return sensible default defaults if nothing is saved
        return { current_menu: 0, chat_hash: "" };
    }
    return JSON.parse(raw);
};
export const setPlayerConfig = (player, config) => {
    const existing = getPlayerConfig(player);
    const updated = { ...existing, ...config };
    player.setDynamicProperty("echo:player_config", JSON.stringify(updated));
};
export function getAllPlayers() {
    people = [];
    let players = world.getAllPlayers();
    players.forEach(player => {
        people.push(player.name);
    });
    people.push("bacon_lord");
    return people;
}
export function setInvitedPlayer(player, invite) {
    const existing = getPlayerConfig(player);
    const existingPlayers = existing.invitedPlayers;
    for (let i = 0; i < existingPlayers.length; i++) {
        if (existingPlayers[i] === invite) {
            console.warn("Invited this friend already!");
            return;
        }
    }
    existingPlayers.push(invite);
    setPlayerConfig(player, { invitedPlayers: existingPlayers });
}
export function getInvitedPlayers(player) {
    const config = getPlayerConfig(player);
    return config.invitedPlayers;
}
//Chat Data functions
export function getChatHashes() {
    const raw = world.getDynamicProperty("echo:all_chat_hashes");
    if (!raw || typeof (raw) !== "string") {
        world.setDynamicProperty("echo:all_chat_hashes", JSON.stringify([]));
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        console.warn("[Echo Chats] Invalid chat hashes data.");
        return [];
    }
}
export function tryStoreChatHash(chatHash) {
    const hashes = getChatHashes();
    for (let i = 0; i < hashes.length; i++) {
        if (hashes[i] === chatHash) {
            console.warn("Invited this friend already!");
            return;
        }
    }
    hashes.push(chatHash);
    world.setDynamicProperty("echo:all_chat_hashes", JSON.stringify(hashes));
}
export function findChatHash(people) {
    let result = "";
    let hash = generateChatHash(people);
    getChatHashes().forEach(storedHash => {
        if (hash === storedHash) {
            console.warn("Hash: ", hash, "Stored Hash: ", storedHash);
            result = storedHash;
        }
    });
    return result;
}
export function resetHashes() {
    world.setDynamicProperty("echo:all_chat_hashes", JSON.stringify([]));
}
export function setPlayerChats(player) {
    let worldChatHashes = world.getDynamicProperty("echo:all_chats_chashes");
}
export function getChatHistory(chatHash) {
    return chatHistory.get(chatHash) ?? [];
}
export function setInChatHistory(chatHash, message) {
    const existing = getChatHistory(chatHash);
    existing.push(message);
    chatHistory.set(chatHash, existing);
}
export function cacheChatHistory() {
    const raw = world.getDynamicProperty("echo_chat:chat_history");
    chatHistory = new Map(typeof raw === "string" ? JSON.parse(raw) : []);
    console.warn("CHAT HISTORY: ", raw);
}
export function saveChatHistory() {
    world.setDynamicProperty("echo_chat:chat_history", JSON.stringify(Array.from(chatHistory.entries())));
    console.warn(chatHistory);
}
