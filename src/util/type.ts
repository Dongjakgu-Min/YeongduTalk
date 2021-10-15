import { Long } from "bson";

interface OAuthCredential {
    readonly userId: Long;
    readonly deviceUUID: string;
    readonly accessToken: string;
    readonly refreshToken: string;
}

interface LoginData extends OAuthCredential {
    userId: Long;
    countryIso: string;
    countryCode: string;
    accountId: number;
    serverTime: number;
    resetUserData: boolean;
    storyURL: string;
    tokenType: string;
    autoLoginAccountId: string;
    displayAccountId: string;
    mainDeviceAgentName: string;
    mainDeviceAppVersion: string;
}

export type { OAuthCredential, LoginData }