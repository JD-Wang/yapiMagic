#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const TSNode = tslib_1.__importStar(require("ts-node"));
const commander_1 = tslib_1.__importDefault(require("commander"));
const consola_1 = tslib_1.__importDefault(require("consola"));
const express_1 = tslib_1.__importDefault(require("express"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const open_1 = tslib_1.__importDefault(require("open"));
const ora_1 = tslib_1.__importDefault(require("ora"));
const path_1 = tslib_1.__importDefault(require("path"));
const prompts_1 = tslib_1.__importDefault(require("prompts"));
const index_1 = require("./Generator/index");
const package_json_1 = tslib_1.__importDefault(require("./../package.json"));
const login_1 = tslib_1.__importDefault(require("./login"));
const utils_1 = require("./utils");
const template_1 = require("./template");
const openChangelog = (outputFilePath) => {
    // 打开变动视图
    const app = express_1.default();
    const updateJson = fs_extra_1.default.readFileSync(utils_1.resolveApp(`${outputFilePath}/update.json`)).toString();
    const port = Math.ceil(Math.random() * 10000);
    app.listen(port, () => {
        const uri = `http://localhost:${port}`;
        console.log(`变更日志：${uri}`);
        open_1.default(uri);
        app.get('/', (req, res) => {
            res.send(template_1.viewHtmlTemplate(updateJson));
        });
    });
};
TSNode.register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs',
    },
});
const generatoraFiles = async (config) => {
    const generator = new index_1.Generator(config);
    // 登陆获取token
    if (!login_1.default.isLogin()) {
        await login_1.default.run(config.serverUrl);
    }
    const spinner = ora_1.default('🛫 正在获取yapi数据样本').start();
    try {
        const output = await generator.generate();
        spinner.info(`🌈 开始写入project: ${config.projectId}`);
        // consola.success('yapi数据成功获取')
        generator.write(output, function (isNew) {
            spinner.stop();
            if (isNew && config.changelog) {
                config.generateUpdateJson && openChangelog(config.outputFilePath);
            }
        });
    }
    catch (e) {
        spinner.stop();
    }
};
(async () => {
    let configFile = path_1.default.join(process.cwd(), 'yapiMagic.config.ts');
    if (!fs_extra_1.default.pathExistsSync(configFile)) {
        configFile = path_1.default.join(process.cwd(), 'yapiMagic.config.js');
    }
    commander_1.default
        .version(package_json_1.default.version)
        .arguments('[cmd]')
        .action(async (cmd) => {
        switch (cmd) {
            case 'init':
                if (await fs_extra_1.default.pathExists(configFile)) {
                    consola_1.default.info(`检测到配置文件: ${configFile}`);
                    const answers = await prompts_1.default({
                        type: 'confirm',
                        name: 'override',
                        message: '是否覆盖已有配置文件?',
                    });
                    if (!answers.override)
                        return;
                }
                await fs_extra_1.default.outputFile(configFile, template_1.configTemplate);
                consola_1.default.success('写入配置文件完毕');
                break;
            case 'changelog':
                let config = require(configFile);
                config = config.default || config;
                if (Object.prototype.toString.call(config) === '[object Array]') {
                    // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
                    config.forEach(configItem => {
                        openChangelog(configItem.outputFilePath);
                    });
                }
                else {
                    // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
                    openChangelog(config.outputFilePath);
                }
                break;
            case 'version':
                console.log(`当前 yapiMagic 版本号 ${package_json_1.default.version}`);
                break;
            case 'clear':
                fs_extra_1.default.remove(path_1.default.join(__dirname, '.yapiUser'));
                break;
            default:
                if (!await fs_extra_1.default.pathExists(configFile)) {
                    return consola_1.default.error(`找不到配置文件: ${configFile}`);
                }
                consola_1.default.success(`找到配置文件: ${configFile}`);
                try {
                    let config = require(configFile);
                    config = config.default || config;
                    // console.log(config)
                    if (Object.prototype.toString.call(config) !== '[object Array]') {
                        config = [config];
                    }
                    for (let configItem of config) {
                        await generatoraFiles(configItem);
                    }
                }
                catch (err) {
                    return consola_1.default.error(err);
                }
                break;
        }
    })
        .parse(process.argv);
})();
