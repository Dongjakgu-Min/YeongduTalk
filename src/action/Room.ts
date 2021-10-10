import API from "./api";
import { ChannelInfo, Chatlog, NormalChannelInfo, TalkChannel, TalkChatData } from 'node-kakao';
import { ChannelStruct, ChatStruct } from "../types/Message";

const ChannelList = async (event: Electron.IpcMainEvent, payload: any) => {
    const CLIENT = await API.getClient();
    const ChannelList = CLIENT.channelList;
    const result: ChannelStruct[] = [];

    for await (let item of Array.from(ChannelList.all())) {
        if (item.getDisplayName().length !== 0) {
            result.push({
                name: item.getDisplayName(),
                info: item.info as ChannelInfo
            });
        }
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

                log.push({
                    channelId: channel.channelId,
                    senderInfo: {
                        senderId: chat.sender.userId,
                        name: userInfo!.nickname,
                        profileURL: userInfo!.profileURL,
                        isMine: CLIENT.clientUser.userId.equals(userInfo!.userId)
                    },
                    data: chat.text as string
                })
            }
        }
    }

    event.reply('GetChatListResult', log);
};

export { ChannelList, getChatList };