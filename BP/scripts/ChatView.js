import { ModalFormData } from "@minecraft/server-ui";
import * as db from "./PlayerDatabase";
// import { secrets, SecretString } from "@minecraft/server-admin"
// const apikey = new SecretString("myName is Messi");
// secrets.names.push("hello world");
// secrets.get("Hello World");
export function buildChatViewForm(player, chatName, chats) {
    const ChatViewForm = new ModalFormData()
        .title("echo:ChatView")
        .textField("", `Reply to ${chatName}`);
    for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];
        if (chat.person === player.name)
            ChatViewForm.header(chat.message);
        else {
            ChatViewForm.label(chat.message);
        }
    }
    ChatViewForm.show(player).then(data => {
        if (data.canceled) {
            db.setPlayerConfig(player, { current_menu: 0 });
            return;
        }
        const msg = data.formValues?.[0] ?? " ";
        console.warn(msg);
        db.setInChatHistory(db.getPlayerConfig(player).chat_hash, { person: player.name, message: msg, index: db.getChatHistory(db.getPlayerConfig(player).chat_hash).length + 1 });
        console.warn("Chat Hash: ", JSON.stringify(db.getPlayerConfig(player)));
        console.warn("Chats: ", JSON.stringify(db.getChatHistory(db.getPlayerConfig(player).chat_hash)));
        const newChats = db.getChatHistory(db.getPlayerConfig(player).chat_hash);
        buildChatViewForm(player, chatName, newChats);
    });
}
