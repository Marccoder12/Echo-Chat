export type PlayerConfig = {
    current_menu: number;
    chat_hash: string;
    invitedPlayers: string[];
    // cache
    cache: Map<string, ChatMessage[]>
}
export type ChatMessage = {
    person : string; //player name
    message: string; //the chat text
    index: number   //message id / order
}
