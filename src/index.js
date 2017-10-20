"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var fp_1 = require("lodash/fp");
var axios_1 = require("axios");
var querystring = require("query-string");
axios_1.default.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios_1.default.defaults.baseURL = 'https://gdcportalgw.its-mo.com';
process.on('unhandledRejection', function (r) { return console.log(r); });
var initial_app_strings = 'geORNtsZe5I4lRGjG9GZiA';
var defaultRegionCode = 'NNA';
var language = 'en-US';
var tz = 'America/Denver';
var tlog = function (t) { return fp_1.default.thru(function (d) { console.log(t, d); return d; }); };
function sleep(ms) {
    if (ms === void 0) { ms = 0; }
    return new Promise(function (r) { return setTimeout(r, ms); });
}
function api(action, data) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1.default.post("/gworchest_160803A/gdc/" + action + ".php", querystring.stringify(data))];
                case 1:
                    response = _a.sent();
                    if (response.data.status === 200) {
                        console.log("\uD83C\uDF43 api " + action + " \uD83D\uDC4D");
                        return [2 /*return*/, response.data];
                    }
                    else {
                        console.log("api " + action + " \uD83D\uDC4E\r\n", response);
                        throw new Error(response.data.ErrorMessage);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.api = api;
var blowpassword = fp_1.default.curry(function (key, plainpass) {
    var cipher = crypto_1.createCipheriv('bf-ecb', key, '');
    var encpass = cipher.update(plainpass, 'utf8', 'base64');
    encpass += cipher.final('base64');
    return encpass;
});
function getsessionid(profile) {
    return profile.VehicleInfoList.vehicleInfo[0].custom_sessionid;
}
function getvin(profile) {
    return profile.VehicleInfoList.vehicleInfo[0].vin;
}
function getregioncode(profile) {
    return profile.CustomerInfo.RegionCode;
}
var acompose = function (fn) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
    }
    return rest.length
        ? function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = fn;
                        return [4 /*yield*/, acompose.apply(void 0, rest).apply(void 0, args)];
                    case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                }
            }); });
        }
        : fn;
};
var challenge = acompose(function (r) { return r.baseprm; }, function () { return api('InitialApp', { initial_app_strings: initial_app_strings }); });
// rawCredentials => apiCredentials
var genCredentials = function (UserId, password, RegionCode) {
    if (RegionCode === void 0) { RegionCode = defaultRegionCode; }
    return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _b = (_a = fp_1.default).compose;
                    _c = [function (Password) { return ({ UserId: UserId, Password: Password, RegionCode: RegionCode }); }];
                    _d = blowpassword;
                    return [4 /*yield*/, challenge()];
                case 1: return [2 /*return*/, _b.apply(_a, _c.concat([_d.apply(void 0, [_e.sent()])]))(password)];
            }
        });
    });
};
// apiCredentials => profile
var userLogin = function (credentials) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, api('UserLoginRequest', __assign({ initial_app_strings: initial_app_strings }, credentials))];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
// rawCredentials => profile
var authenticate = acompose(userLogin, genCredentials);
// rawCredentials => (apioperation => apiresults)
exports.loginSession = acompose(function (s) { return function (action) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, api(action, __assign({}, s))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); }; }, function (profile) { return ({ custom_sessionid: getsessionid(profile), VIN: getvin(profile), RegionCode: getregioncode(profile) }); }, authenticate);
var pollresult = fp_1.default.curry(function (session, action, resultKey) { return __awaiter(_this, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, sleep(5000)];
            case 1:
                _a.sent();
                return [4 /*yield*/, session(action, { resultKey: resultKey })];
            case 2:
                result = _a.sent();
                _a.label = 3;
            case 3:
                if (result.responseFlag !== '1') return [3 /*break*/, 0];
                _a.label = 4;
            case 4: return [2 /*return*/, result];
        }
    });
}); });
var longpollrequest = fp_1.default.curry(function (action, pollaction, session) {
    return acompose(pollresult(session, pollaction), function (r) { return r.resultKey; }, function () { return session(action); })();
});
exports.batteryRecords = function (session) { return session('BatteryStatusRecordsRequest'); };
exports.batteryStatusCheckRequest = function (session) { return session('BatteryStatusCheckRequest'); };
exports.batteryStatusCheck = function (session) { return longpollrequest('BatteryStatusCheckResultRequest', 'BatteryStatusCheckResultRequest', session); };
exports.hvacOn = function (session) { return longpollrequest('ACRemoteRequest', 'ACRemoteResult', session); };
exports.hvacOff = function (session) { return longpollrequest('ACRemoteOffRequest', 'ACRemoteOffResult', session); };
exports.hvacStatus = function (session) { return session('RemoteACRecordsRequest'); };
