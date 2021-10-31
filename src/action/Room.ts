import API from "./api";
import {AttachmentApi, ChannelInfo, ChatBuilder, FileAttachment, KnownChatType, TalkChannel} from 'node-kakao';
import {ChannelStruct, ChatStruct} from "../types/Message";
import {getEmoticonImageURL, getEmoticonThumbnailURL} from "../util/util";
import {readFileSync} from "fs";
import hasha from "hasha";
import {number} from "prop-types";

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
                const serviceApi = await API.getServiceApiClient();
                let emoticonImg = undefined;
                let attachedImg = undefined;
                let attachedFile = undefined;
                let attachedFileData = undefined;

                console.log(chat);

                if (chat.type === 20)
                    emoticonImg = getEmoticonThumbnailURL(chat.attachment?.path as string)
                else if (chat.type === 12)
                    emoticonImg = getEmoticonImageURL(chat.attachment?.path as string);
                else if (chat.type === 2)
                    attachedImg = chat.attachment?.url as string;
                else if (chat.type === KnownChatType.FILE) {
                    const result = await serviceApi.requestSessionURL(chat.attachment?.k as string);
                    const file = await channel.downloadMediaThumb({ key: chat.attachment?.k as string }, KnownChatType.FILE);

                    if (result.success)
                        attachedFile = result.result;
                    if (file.success && chat.attachment)
                        attachedFileData = { size: chat.attachment.size as number, key: chat.attachment.k as string, type: KnownChatType.FILE }
                }

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
                    attachedImg,
                    attachedFile,
                    attachedFileData
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

    if (!payload.filePath) channel?.sendChat(payload.message);
    else {
        const { filePath, fileSize } = payload.filePath;

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

const receiveData = async (event: Electron.IpcMainEvent, payload: any) => {
    const { type, key } = payload;
    const CLIENT = await API.getClient();
    const ChannelList = CLIENT.channelList;
    let channel: TalkChannel | undefined = undefined;
    let buffer: Uint8Array;

    for await (let item of ChannelList.normal.all()) {
        if (item.channelId.equals(payload.channelId)) {
            channel = item;
        }
    }

    if (channel === undefined) throw Error('Channel Not Found');

    console.log(payload);
    console.log(type);
    console.log(key);

    const chunk = await channel.downloadMedia({ key }, type);
    console.log('독수리~오형제~');
    if (!chunk || !chunk.success) {
        console.log('천하무적~');
        return;
    }

    const stream = chunk.result;
    console.log(stream.size);

    while (!stream.done) {
        let offset = stream.readSize;
        buffer = new Uint8Array(stream.size - stream.readSize < 1000000 ? stream.size - stream.readSize : 1000000);
        console.log(stream.readSize);
        await stream.read(buffer);
        event.reply('ReceiveDataResult', {buffer, end: stream.done, offset});
    }

    stream.close();
}

export { ChannelList, getChatList, sendMessage, receiveData };