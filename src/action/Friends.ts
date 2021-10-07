import API from "./api";
import { ServiceApiClient } from "node-kakao";
import {Error} from "memfs/lib/internal/errors";

const FriendList = async (event: Electron.IpcMainEvent, payload: any) => {
    const api = await API.getApp();
    if (!api.result) throw new Error('Login Error');

    const serviceApiClient = await ServiceApiClient.create(api.result);
    const result = await serviceApiClient.requestMyProfile();

    console.log(result);
}

export { FriendList };