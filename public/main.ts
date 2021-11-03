import {app, BrowserWindow, ipcMain, Menu, Tray} from 'electron';
import {AttachmentApiClient, KnownChatType} from 'node-kakao';
import {Login, Passcode, RegisterDevice} from "../src/action/deviceRegister";
import {ChannelList, getChatList, sendMessage, receiveData} from '../src/action/Room';
import * as path from 'path';

import API from "../src/action/api";
import {GetMyProfile} from "../src/action/information";
import {getEmoticonImageURL, getEmoticonThumbnailURL} from '../src/util/emoticon';

let mainWindow: BrowserWindow;
const CLIENT = API.getClient();
let counter = 0;
let tray = null;

CLIENT.on('chat', async (data, channel) => {
    const sender = await data.getSenderInfo(channel);
    let emoticonImg = undefined;
    let attachedImg = undefined;
    let attachedFile = undefined;
    if (!sender) return;

    const app = await API.getApp();

    switch (data.chat.type) {
        case KnownChatType.PHOTO: attachedImg = data.chat.attachment?.url; break;
        case KnownChatType.STICKER: emoticonImg = getEmoticonImageURL(data.chat.attachment?.path as string); break;
        case KnownChatType.STICKERANI:
            const emoticon = data.chat.attachment?.path;
            emoticonImg = getEmoticonThumbnailURL(emoticon as string);
            break;
        case KnownChatType.FILE:
            attachedFile = data.chat.attachment?.url;
            break;
        default: break;
    }

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
        attachedImg,
        attachedFile
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(process.cwd(), 'public/img/logo.png'),
    });

    mainWindow.loadFile('dist/index.html');
}

app.whenReady().then(() => {
    createWindow();
    const menu = Menu.buildFromTemplate([
        { label: '영두톡 종료', click: () => { app.exit() }},
    ]);

    tray = new Tray(process.cwd() + '/public/img/chat.png');
    tray.setToolTip('YeongduTalk')
    tray.setContextMenu(menu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    mainWindow.on('close', (event) => {
        mainWindow.hide();
        event.preventDefault();
    });

    tray.on('click', () => {
        mainWindow.show();
    });
    tray.setTitle('영두톡');

    ipcMain.on('DeviceRegister', RegisterDevice);
    ipcMain.on('Login', Login);
    ipcMain.on('Register', Passcode);
    ipcMain.on('ChannelList', ChannelList);
    ipcMain.on('GetMyProfile', GetMyProfile);
    ipcMain.on('GetChatList', getChatList);
    ipcMain.on('SendMessage', sendMessage);
    ipcMain.on('ReceiveData', receiveData);
});