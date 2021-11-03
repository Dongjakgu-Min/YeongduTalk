import API from "./api";
import {AttachmentApi, ChannelInfo, ChatBuilder, FileAttachment, KnownChatType, TalkChannel} from 'node-kakao';
import {ChannelStruct, ChatStruct} from "../types/Message";
import {readFileSync} from "fs";
import hasha from "hasha";
import { getMessageObj } from '../util/message';

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
    const serviceApi = await API.getServiceApiClient();
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

                if (!userInfo) throw new Error('UserInfo Not Found');

                log.push(await getMessageObj(chat, serviceApi, channel, userInfo));
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
                .text(filenameArray[filenameArray.length - 1])
                .attachment(attachRes.result)
                .attachment(fileAttach)
                .build(KnownChatType.FILE)
        );
    }

    if (channel && channel.chatListStore.all()) {
        await channel.updateAll();
        const lastChat = await channel.chatListStore.last();
        const userInfo = channel.getUserInfo(channel.clientUser);
        const serviceApi = await API.getServiceApiClient();

        if (!lastChat || !userInfo) throw new Error('UserData or LastChat not Found');

        event.reply('NewChat', await getMessageObj(lastChat, serviceApi, channel, userInfo));
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

    const chunk = await channel.downloadMedia({ key }, type);
    if (!chunk || !chunk.success) {
        return;
    }

    const stream = chunk.result;

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