import { app, BrowserWindow, ipcMain, WebContents } from 'electron';
import { AuthApiClient, KnownAuthStatusCode, util } from 'node-kakao';
import {RegisterDevice, Passcode} from "../src/action/deviceRegister";
import { FriendList } from '../src/action/Friends';
import { ChannelList } from '../src/action/Room';

import API from "../src/action/api";
import {GetMyProfile} from "../src/action/information";

let mainWindow: BrowserWindow;
const CLIENT = API.getClient();
let counter = 0;

CLIENT.on('chat', (data, channel) => {
    const sender = data.getSenderInfo(channel);
    if (!sender) return;

    console.log(sender);

    console.log(`${sender.nickname}: ${data.text}`);

    const test = channel.chatListStore.all();
    const func = async () => {
        for await (const result of test) {
            console.log(result);
        }
    }

    func().then()


    mainWindow.webContents.send('NewChat', {
        id: channel.channelId,
        senderInfo: {
            senderId: sender.userId,
            name: sender.nickname,
            profileURL: sender.profileURL
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
});