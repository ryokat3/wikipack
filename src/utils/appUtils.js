"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.makeFileRegexChecker = exports.getFileName = exports.getDir = exports.normalizePath = exports.addPath = exports.splitPath = exports.arrayBufferToStringLarge = exports.arrayBufferToString = exports.dataUrlDecodeAsArrayBuffer = exports.dataUrlDecodeAsBlob = exports.dataUrlDecode = exports.dataUrlEncode = void 0;
var function_1 = require("fp-ts/function");
var O = require("fp-ts/Option");
/************************************************************************************************
Data URI converter
************************************************************************************************/
function dataUrlEncode(data, mime) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        if (typeof reader.result === 'string') {
                            resolve(reader.result);
                        }
                        else if (reader.result !== null) {
                            resolve(arrayBufferToString(reader.result));
                        }
                        else {
                            resolve(null);
                        }
                    };
                    reader.readAsDataURL(new Blob([data], { type: mime }));
                })];
        });
    });
}
exports.dataUrlEncode = dataUrlEncode;
function dataUrlDecode(dataUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fetch(dataUrl).then(function (response) { return response.text(); })];
        });
    });
}
exports.dataUrlDecode = dataUrlDecode;
function dataUrlDecodeAsBlob(dataUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fetch(dataUrl).then(function (response) { return response.blob(); })];
        });
    });
}
exports.dataUrlDecodeAsBlob = dataUrlDecodeAsBlob;
function dataUrlDecodeAsArrayBuffer(dataUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fetch(dataUrl).then(function (response) { return response.arrayBuffer(); })];
        });
    });
}
exports.dataUrlDecodeAsArrayBuffer = dataUrlDecodeAsArrayBuffer;
function arrayBufferToString(buf) {
    return String.fromCharCode.apply(null, Buffer.from(buf).toJSON().data);
}
exports.arrayBufferToString = arrayBufferToString;
function arrayBufferToStringLarge(buf) {
    var result = [];
    var len = 1024;
    for (var p = 0; p < buf.byteLength; p += len) {
        result.push(arrayBufferToString(buf.slice(p, p + len)));
    }
    return result.join("");
}
exports.arrayBufferToStringLarge = arrayBufferToStringLarge;
/************************************************************************************************
File Path
************************************************************************************************/
function removeParentDir(pathName) {
    var result = [];
    for (var i = 0; i < pathName.length; i++) {
        if (i == pathName.length - 1) {
            result.push(pathName[i]);
        }
        else if (pathName[i] !== ".." && pathName[i + 1] === "..") {
            ++i;
        }
        else {
            result.push(pathName[i]);
        }
    }
    return result;
}
function splitPath(pathName) {
    return pathName ? (0, function_1.pipe)(pathName.split('/'), function (pathList) { return pathList.length > 0 ? O.some(pathList) : O.none; }, 
    //        O.map((pathList:string[])=> pathList.at(0) === '' ? pathList.slice(1) :  pathList),
    //        O.chain((pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none),
    //        O.map((pathList:string[])=> pathList.at(-1) === '' ? pathList.slice(0,-1) :  pathList),
    //        O.chain((pathList:string[]) => pathList.length > 0 ? O.some(pathList) : O.none),       
    O.map(function (pathList) { return pathList.filter(function (name) { return name !== "." && name !== ''; }); }), O.map(function (pathList) { return removeParentDir(pathList); }), O.getOrElse(function () { return []; })) : [];
}
exports.splitPath = splitPath;
function addPath(dirName, fileName) {
    return splitPath("".concat(dirName ? dirName + "/" : "").concat(fileName)).join("/");
}
exports.addPath = addPath;
function normalizePath(fileName) {
    return fileName ? splitPath(fileName).join("/") : "";
}
exports.normalizePath = normalizePath;
function getDir(fileName) {
    return splitPath(fileName).slice(0, -1).join('/');
}
exports.getDir = getDir;
function getFileName(filePath) {
    return splitPath(filePath).pop() || "";
}
exports.getFileName = getFileName;
/************************************************************************************************
Markdown File
************************************************************************************************/
function makeFileRegexChecker(regexList) {
    var compiledRegexList = regexList.map(function (re) { return new RegExp(re, "i"); });
    return function (name) {
        //for (const regex of regexList.map((re:string)=>new RegExp(re, "i"))) {
        for (var _i = 0, compiledRegexList_1 = compiledRegexList; _i < compiledRegexList_1.length; _i++) {
            var regex = compiledRegexList_1[_i];
            if (name.match(regex)) {
                return true;
            }
        }
        return false;
    };
}
exports.makeFileRegexChecker = makeFileRegexChecker;
