import {ChannelInfo} from "./Channel";
import {Long} from "bson";

type ChannelStruct = {
    name: string,
    info: ChannelInfo
};

type ChatStruct = {
    channelId: Long,
    senderInfo: {
        senderId: Long,
        name: string,
        profileURL: string,
        isMine: boolean
    }
    data: string
}

type MyProfileStruct = {
    userId: Long,
    username: string
}

export type { ChannelStruct, ChatStruct, MyProfileStruct }