declare const getToken: (serverUrl: string) => Promise<{
    _yapi_token: String;
    _yapi_uid: String;
}>;
export default getToken;
