import {AsyncCommandResult, AuthApiClient, KnownAuthStatusCode, TalkClient, util} from 'node-kakao';
import { LoginData } from '../util/type';

export default class API {
    private static instance: AuthApiClient;
    private static CLIENT: TalkClient = new TalkClient();
    private static app: { status: number, success: boolean, result?: LoginData}

    private static UUID = process.env['deviceUUID'] as string;
    private static NAME = process.env['deviceNAME'] as string;

    public static async login(form: { email: string, password: string }) {
        if (!this.UUID) console.log(util.randomWin32DeviceUUID());

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
        return this.instance || (this.instance = await AuthApiClient.create(this.NAME, this.UUID))
    }

    public static async getApp() {
        return this.app;
    }

    public static getClient() {
        return this.CLIENT;
    }
}