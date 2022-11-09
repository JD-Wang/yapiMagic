declare class Login {
    _yapi_token: String;
    _yapi_uid: String;
    constructor();
    run(serverUrl: string): Promise<void>;
    isLogin(): boolean;
    getCookie(): string;
}
declare const _default: Login;
export default _default;
