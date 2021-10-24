import {AsyncCommandResult, AuthApiClient, KnownAuthStatusCode, TalkClient, util} from 'node-kakao';
import { LoginData } from '../util/type';
import storage from 'electron-json-storage';

export default class API {
    private static instance: AuthApiClient;
    private static CLIENT: TalkClient = new TalkClient();
    private static app: { status: number, success: boolean, result?: LoginData};

    private static Info: { UUID: string, NAME: string } = storage.getSync('info') as { UUID: string , NAME: string };

    public static async login(form: { email: string, password: string, username?: string }) {
        if (!this.Info.UUID) {
            const data = await storage.getSync('info');
            storage.set('info', {...data, UUID: util.randomWin32DeviceUUID()}, error => {})
        }

        if (form.username) {
            const data = await storage.getSync('info');
            storage.set('info', {...data, NAME: form.username}, error => {})
        }

        if (this.app === undefined || !this.app.success) {
            this.app = await this.instance.login(form);

            if (!this.app.success && this.app.status !== KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
                throw new Error(`Web login failed with status: ${this.app.status}`);
            }
            if (this.app.status === KnownAuthStatusCode.DEVICE_NOT_REGISTERED)
                return;

            const res = await this.CLIENT.login(this.app.result!);
            if (!res.success) throw new Error(`Login Failed(login) : ${res.status}`);
        }
    }

    public static async getInstance() {
        return this.instance || (this.instance = await AuthApiClient.create(this.Info.NAME, this.Info.UUID))
    }

    public static async getApp() {
        return this.app;
    }

    public static getClient() {
        return this.CLIENT;
    }

    public static async SyncAuthApiClient() {
        this.Info = await storage.getSync('info') as { UUID: string , NAME: string };
        this.instance = await AuthApiClient.create(this.Info.NAME, this.Info.UUID);
    }
}