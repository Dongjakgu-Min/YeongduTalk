import { Long } from 'bson';
import {ChannelMetaMap, ChannelType, Chatlog, DisplayUserInfo} from "node-kakao";

export interface Channel {
    readonly channelId: Long;
}

export interface ChannelInfo extends Channel {
    type: ChannelType;
    activeUserCount: number;
    newChatCount: number;
    newChatCountInvalid: boolean;
    lastChatLogId: Long;
    lastSeenLogId: Long;
    lastChatLog?: Chatlog;
    metaMap: ChannelMetaMap;
    displayUserList: DisplayUserInfo[];
    pushAlert: boolean;
}

export interface NormalChannelInfo extends ChannelInfo {
    joinTime: number;
}