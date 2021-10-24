import {AuthApiClient, KnownAuthStatusCode, util} from "node-kakao";
import API from './api';

const RegisterDevice = async (event: Electron.IpcMainEvent, payload: any) => {
    const form = {
        ...payload,
        forced: true
    };

    const check = await API.getApp();

    const api = await API.getInstance();
    await API.login(form);
    const loginRes = await API.getApp();

    if (loginRes.success) {
        console.log('Login Success');
        return event.reply('AlreadyLogin', { userId: loginRes.result?.userId, name: api.name });
    }
    if (loginRes.status === KnownAuthStatusCode.DEVICE_NOT_REGISTERED && check !== undefined) {
        await API.SyncAuthApiClient();
        const passcodeRes = await api.requestPasscode(form);
        if (!passcodeRes.success) throw new Error(`Passcode request failed with status: ${passcodeRes.status}`);
    } else if (loginRes.status !== KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
        throw new Error(`Web login failed with status: ${loginRes.status}`);
    }

    event.reply('LoginResult', { status: true, msg: payload });
}

const Passcode = async (event: Electron.IpcMainEvent, payload: any) => {
    const api = await API.getInstance();
    const registerRes = await api.registerDevice(payload.form, payload.passcode, true);
    if (!registerRes.success) throw new Error(`Device registration failed with status: ${registerRes.status}`);

    console.log(`Device ${process.env['deviceUUID']} has been registered`);

    // Login after registering devices
    const loginAfterRes = await api.login(payload.form);
    if (!loginAfterRes.success) throw new Error(`Web login failed with status: ${loginAfterRes.status}`);
    console.log(`Client logon successfully`);

    await API.login(payload.form);

    event.reply('RegisterResult', { status: true });
}

const Login = async (event: Electron.IpcMainEvent, payload: any) => {
    await API.login(payload.form);
    const loginAfterRes = await API.getApp();
    if (!loginAfterRes.success) throw new Error(`Web login failed with status: ${loginAfterRes.status}`);

    event.reply('LoginResult', { status: true });
}

const SyncChannel = async (event: Electron.IpcMainEvent, payload: any) => {
    
}

export { RegisterDevice, Passcode, Login };