import API from "./api";
import {AttachmentApi, ChannelInfo, ChatBuilder, FileAttachment, KnownChatType, TalkChannel} from 'node-kakao';
import {ChannelStruct, ChatStruct} from "../types/Message";
import {getEmoticonImageURL, getEmoticonThumbnailURL} from "../util/util";
import {readFileSync} from "fs";
import hasha from "hasha";

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
                let attachedImg = undefined;

                if (chat.type === 20)
                    emoticonImg = getEmoticonThumbnailURL(chat.attachment?.path as string)
                else if (chat.type === 12)
                    emoticonImg = getEmoticonImageURL(chat.attachment?.path as string);
                else if (chat.type === 2)
                    attachedImg = chat.attachment?.url as string;

                log.push({
                    channelId: channel.channelId,
                    senderInfo: {
                        senderId: chat.sender.userId,
                        name: userInfo!.nickname,
                        profileURL: userInfo!.profileURL,
                        isMine: CLIENT.clientUser.userId.equals(userInfo!.userId)
                    },
                    data: chat.text as string,
                    emoticonImg,
                    attachedImg
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
    const { filePath, fileSize } = payload.filePath;

    for await (let item of ChannelList.normal.all()) {
        if (item.channelId.equals(payload.channelId)) {
            channel = item;
        }
    }

    if (!filePath) channel?.sendChat(payload.message);
    else {
        const attachRes = await AttachmentApi.upload(KnownChatType.FILE, filePath, readFileSync(filePath));

        if (!attachRes.success) return;

        const filenameArray = filePath.split('/');

        const fileAttach: FileAttachment = {
            name: filenameArray[filenameArray.length - 1],
            size: fileSize,
            expire: 1000 * 3600 * 24 * 7,
            cs: await hasha.fromFile(filePath, { algorithm: 'sha1' })
        }

        channel?.sendChat(
            new ChatBuilder()
                .attachment(attachRes.result)
                .attachment(fileAttach)
                .build(KnownChatType.FILE)
        );
    }
}

export { ChannelList, getChatList, sendMessage };