declare class GetYapiUserFile {
    yapiUserFile: string;
    constructor();
    setServer(server: string): void;
    getPath(): string;
    saveFile(data: any): void;
    deleteFile(): void;
}
declare const _default: GetYapiUserFile;
export default _default;
