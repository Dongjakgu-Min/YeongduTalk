import { app, BrowserWindow, ipcMain, WebContents } from 'electron';
import { TalkNormalChannel } from 'node-kakao';
import {RegisterDevice, Passcode, Login} from "../src/action/deviceRegister";
import { FriendList } from '../src/action/Friends';
import {ChannelList, getChatList, sendMessage} from '../src/action/Room';

import API from "../src/action/api";
import {GetMyProfile} from "../src/action/information";
import { getEmoticonImageURL, getEmoticonThumbnailURL } from '../src/util/util';

let mainWindow: BrowserWindow;
const CLIENT = API.getClient();
let counter = 0;

CLIENT.on('chat', async (data, channel) => {
    const sender = await data.getSenderInfo(channel);
    let emoticonImg = undefined;
    let attachedImg = undefined;
    if (!sender) return;

    const app = await API.getApp();

    console.log(data.chat);
    console.log(data.chat.attachment);

    if (data.chat.type === 20) {
        const emoticon = data.chat.attachment?.path;
        emoticonImg = getEmoticonThumbnailURL(emoticon as string);
    } else if (data.chat.type === 12)
        emoticonImg = getEmoticonImageURL(data.chat.attachment?.path as string);
    else if (data.chat.type === 2)
        attachedImg = data.chat.attachment?.url

    mainWindow.webContents.send('NewChat', {
        channelId: channel.channelId,
        senderInfo: {
            senderId: sender.userId,
            name: sender.nickname,
            profileURL: sender.profileURL,
            isMine: app.result?.userId.equals(sender.userId)
        },
        data: data.text,
        emoticonImg,
        attachedImg
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('dist/index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    ipcMain.on('DeviceRegister', RegisterDevice);
    ipcMain.on('Login', Login);
    ipcMain.on('Register', Passcode);
    ipcMain.on('ChannelList', ChannelList);
    ipcMain.on('GetMyProfile', GetMyProfile);
    ipcMain.on('GetChatList', getChatList);
    ipcMain.on('SendMessage', sendMessage);
});