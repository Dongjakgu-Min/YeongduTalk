import API from "./api";
import { NormalChannelInfo } from 'node-kakao';

type Channel = {
    name: string,
    info: NormalChannelInfo
};

const ChannelList = async (event: Electron.IpcMainEvent, payload: any) => {
    const CLIENT = await API.getClient();
    const ChannelList = CLIENT.channelList;
    const result: Channel[] = [];

    for (let item of Array.from(ChannelList.normal.all())) {
        console.log(item.getDisplayName());
        if (item.getDisplayName().length !== 0) {
            result.push({
                name: item.getDisplayName(),
                info: item.info
            });
        }
    }

    event.reply('ChannelResponse', result)
};

const getChatList = async (event: Electron.IpcMainEvent, payload: any) => {
    const CLIENT = await API.getClient();
};

export { ChannelList };