import {getEmoticonImageURL, getEmoticonThumbnailURL} from "./emoticon";
import {ChannelUserInfo, Chatlog, KnownChatType, ServiceApiClient, TalkChannel} from "node-kakao";

export async function getMessageObj(chat: Chatlog, serviceApi: ServiceApiClient, channel: TalkChannel, userInfo: ChannelUserInfo) {
    let emoticonImg = undefined;
    let attachedImg = undefined;
    let attachedFile = undefined;
    let attachedFileData = undefined;

    if (!chat) throw new Error('Chat Not Found');

    switch (chat.type) {
        case KnownChatType.STICKERANI: emoticonImg = getEmoticonThumbnailURL(chat.attachment?.path as string); break;
        case KnownChatType.STICKER: emoticonImg = getEmoticonImageURL(chat.attachment?.path as string); break;
        case KnownChatType.PHOTO: attachedImg = chat.attachment?.url as string; break;
        case KnownChatType.FILE:
            const file = await channel.downloadMediaThumb({ key: chat.attachment?.k as string }, KnownChatType.FILE);

            if (file.success && chat.attachment)
                attachedFileData = { size: chat.attachment.size as number, key: chat.attachment.k as string, type: KnownChatType.FILE }
            break;
    }

    return {
        channelId: channel.channelId,
        senderInfo: {
            senderId: userInfo.userId,
            name: userInfo?.nickname,
            profileURL: userInfo.profileURL,
            isMine: channel.clientUser.userId.equals(userInfo.userId)
        },
        data: chat?.text as string,
        emoticonImg,
        attachedImg,
        attachedFile,
        attachedFileData
    }
}