import { app, BrowserWindow, ipcMain, WebContents } from 'electron';
import { TalkNormalChannel } from 'node-kakao';
import {RegisterDevice, Passcode} from "../src/action/deviceRegister";
import { FriendList } from '../src/action/Friends';
import { ChannelList, getChatList } from '../src/action/Room';

import API from "../src/action/api";
import {GetMyProfile} from "../src/action/information";
import {Long} from "bson";

let mainWindow: BrowserWindow;
const CLIENT = API.getClient();
let counter = 0;

CLIENT.on('chat', async (data, channel) => {
    const sender = await data.getSenderInfo(channel);
    if (!sender) return;

    console.log(sender);

    console.log(`${sender.nickname}: ${data.text}`);

    for await (let i of channel.syncChatList(data.chat.logId)) {
        if (i.success) {
            for (let chat of i.result) {
                console.log(chat.sender)
            }
        }
    }

    console.log(channel.chatListStore.last());

    const app = await API.getApp();

    await mainWindow.webContents.send('NewChat', {
        channelId: channel.channelId,
        senderInfo: {
            senderId: sender.userId,
            name: sender.nickname,
            profileURL: sender.profileURL,
            isMine: app.result?.userId.equals(sender.userId)
        },
        data: data.text
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

    ipcMain.on('Login', RegisterDevice);
    ipcMain.on('Register', Passcode);
    ipcMain.on('ChannelList', ChannelList);
    ipcMain.on('GetMyProfile', GetMyProfile);
    ipcMain.on('GetChatList', getChatList);
});