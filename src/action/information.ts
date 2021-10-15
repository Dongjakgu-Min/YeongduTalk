import API from "./api";
import { ServiceApiClient } from "node-kakao";
import {Error} from "memfs/lib/internal/errors";
import {  } from '../util/type';

const GetMyProfile = async (event: Electron.IpcMainEvent, payload: any) => {
    const api = await API.getApp();
    if (!api.result) throw new Error('Login Error');

    const userId = await api.result.userId;
    const serviceClient = await ServiceApiClient.create({
        userId,
        deviceUUID: api.result.deviceUUID,
        accessToken: api.result.accessToken,
        refreshToken: api.result.refreshToken
    });

    const myProfile = await serviceClient.requestMoreSettings();
    if (myProfile.success) {
        event.reply('GetMyProfileResult', { userId, username: myProfile.result.nickName });
    }
    else throw new Error('Failed Load Profile');
}

export {
    GetMyProfile
};