import {ChannelInfo} from "./Channel";
import {Long} from "bson";
import {FileAttachment} from "node-kakao";

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
    data: string,
    emoticonImg?: string,
    attachedImg?: string,
    attachedFile?: string
    attachedFileData?: { size: number, key: string, type: number }
}

type MyProfileStruct = {
    userId: Long,
    username: string
}

export type { ChannelStruct, ChatStruct, MyProfileStruct }