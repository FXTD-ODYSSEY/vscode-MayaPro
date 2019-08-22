"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const mel_data = __importStar(require("./mel.json"));
const cmds_data = __importStar(require("./cmds.json"));
class TimeUtils {
    static getTime() {
        return new Date()
            .toISOString()
            .replace(/T/, ' ')
            .replace(/\..+/, '')
            .split(' ')[1];
    }
}
exports.TimeUtils = TimeUtils;
// NOTE Logger 信息输出
class Logger {
    static registerOutputPanel(outputPanel) {
        this._outputPanel = outputPanel;
    }
    static info(log) {
        this.typeLog(log, 'INFO');
    }
    static error(log) {
        this.typeLog(log, 'ERROR');
        vscode.window.showErrorMessage(log);
    }
    static success(log) {
        this.typeLog(log, 'SUCCESS');
    }
    static response(log) {
        this.typeLog(log, 'RESPONSE');
    }
    static typeLog(log, type) {
        if (!this._outputPanel) {
            return;
        }
        let util = require('util');
        let time = TimeUtils.getTime();
        if (!log || !log.split)
            return;
        this._outputPanel.appendLine(util.format('Maya Intellisense [%s][%s]\t %s', time, type, log));
    }
}
exports.Logger = Logger;
function activate(context) {
    let outputPanel = vscode.window.createOutputChannel('Maya Intellisense');
    Logger.registerOutputPanel(outputPanel);
    let mel_completions = [];
    let cmds_completions = [];
    // NOTE 初始化插件的时候 
    // NOTE 获取 MEL 数据存放到数组当中
    mel_data['completions'].forEach(this_item => {
        let item = new vscode.CompletionItem(this_item['trigger'], vscode.CompletionItemKind.Function);
        item.detail = this_item['trigger'];
        item.documentation = this_item['comment'];
        mel_completions.push(item);
    });
    // NOTE 获取 cmds 数据存放到数组当中
    for (let command in cmds_data['completions']) {
        let item = new vscode.CompletionItem(command, vscode.CompletionItemKind.Function);
        item.detail = command;
        // doc = cmds['completions'][command]['instruction'];
        item.documentation = cmds_data['completions'][command]['instruction'];
        cmds_completions.push(item);
    }
    function getImportName(documentText, pacakge) {
        let cmds = pacakge;
        // NOTE 如果没有 导入相关的包 则 关闭自动补全
        if (documentText.search(new RegExp(`from maya import ${pacakge}`, "i")) == -1 &&
            documentText.search(new RegExp(`import maya.${pacakge}`, "i")) == -1)
            return undefined;
        // NOTE 匹配别名的情况
        let match = documentText.match(new RegExp(`import maya.${pacakge} as (.*)`, "i"));
        if (match != null && match.length >= 2 && match[1] != "") {
            cmds = match[1].trim();
        }
        else {
            match = documentText.match(new RegExp(`from maya import ${pacakge} as (.*)`, "i"));
            if (match != null && match.length >= 2 && match[1] != "")
                cmds = match[1].trim();
        }
        return cmds;
    }
    const cmds_func_compeletion = vscode.languages.registerCompletionItemProvider('python', {
        provideCompletionItems(document, position) {
            let cmds = getImportName(document.getText(), "cmds");
            // NOTE `document.lineAt(position).text`  获取当前光标所在行的文本
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!linePrefix.endsWith(cmds + '.'))
                return undefined;
            return [...cmds_completions];
        }
    }, '.' // NOTE triggered whenever a '.' is being typed
    );
    const cmds_arg_compeletion = vscode.languages.registerCompletionItemProvider('python', {
        provideCompletionItems(document, position) {
            let cmds_args = [];
            let cmds = getImportName(document.getText(), "cmds");
            // NOTE `document.lineAt(position).text`  获取当前光标所在行的文本
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (linePrefix.search(/\(/i) == -1)
                return undefined;
            let match = linePrefix.split("(")[0].match(new RegExp(`${cmds}\.(.*)`, "i"));
            if (match == null)
                return undefined;
            let func = match[1];
            cmds_data['completions'][func]['param'].forEach(this_item => {
                let item = new vscode.CompletionItem(`${this_item['shortName']}=`, vscode.CompletionItemKind.Function);
                item.detail = `${this_item['longName']} [${this_item['type']}]`;
                item.documentation = this_item['instruction'];
                cmds_args.push(item);
                item = new vscode.CompletionItem(`${this_item['longName']}=`, vscode.CompletionItemKind.Function);
                item.detail = `${this_item['longName']} [${this_item['type']}]`;
                item.documentation = this_item['instruction'];
                cmds_args.push(item);
            });
            return [...cmds_args];
        }
    }, '(', ',');
    // Logger.info(`data: ${data['completions']}`);
    context.subscriptions.push(cmds_func_compeletion, cmds_arg_compeletion);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map