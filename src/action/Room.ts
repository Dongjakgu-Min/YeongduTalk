import API from "./api";
import { ChannelInfo, TalkChannel, TalkChatData, Chat, EmoticonAttachment } from 'node-kakao';
import { ChannelStruct, ChatStruct } from "../types/Message";
import {getEmoticonImageURL, getEmoticonThumbnailURL} from "../util/util";

const ChannelList = async (event: Electron.IpcMainEvent, payload: any) => {
    const CLIENT = await API.getClient();
    const ChannelList = CLIENT.channelList;
    const result: ChannelStruct[] = [];

    for await (let item of ChannelList.all()) {
        result.push({
            name: item.getDisplayName() === '' ? '자신과의 채팅' : item.getDisplayName(),
            info: item.info as ChannelInfo
        });
    }

    console.log(`Rooms : ${CLIENT.channelList.size}`)

    event.reply('ChannelResponse', result)
};

const getChatList = async (event: Electron.IpcMainEvent, payload: any) => {
    const CLIENT = await API.getClient();
    const ChannelList = CLIENT.channelList;
    let channel: TalkChannel | undefined = undefined;

    const log: ChatStruct[] = [];

    console.log(payload.channelId);
    for await (let item of ChannelList.normal.all()) {
        if (item.channelId.equals(payload.channelId)) {
            channel = item;
        }
    }

    if (channel === undefined) throw Error('Channel Not Found');
    for await (let item of channel.syncChatList(channel.info.lastChatLogId)) {
        if (item.success) {
            for (let chat of item.result) {
                const userInfo = channel.getUserInfo(chat.sender);
                let emoticonImg = undefined;

                if (chat.type === 20)
                    emoticonImg = getEmoticonThumbnailURL(chat.attachment?.path as string)
                else if (chat.type === 12)
                    emoticonImg = getEmoticonImageURL(chat.attachment?.path as string);

                log.push({
                    channelId: channel.channelId,
                    senderInfo: {
                        senderId: chat.sender.userId,
                        name: userInfo!.nickname,
                        profileURL: userInfo!.profileURL,
                        isMine: CLIENT.clientUser.userId.equals(userInfo!.userId)
                    },
                    data: chat.text as string,
                    emoticonImg
                });
            }
        }
    }

    event.reply('GetChatListResult', log);
};

const sendMessage = async (event: Electron.IpcMainEvent, payload: any) => {
    const CLIENT = await API.getClient();
    const ChannelList = CLIENT.channelList;
    let channel: TalkChannel | undefined = undefined;

    for await (let item of ChannelList.normal.all()) {
        if (item.channelId.equals(payload.channelId)) {
            channel = item;
        }
    }

    channel?.sendChat(payload.message);
}

export { ChannelList, getChatList, sendMessage };