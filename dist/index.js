"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const fp_1 = require("lodash/fp");
const axios_1 = require("axios");
const querystring = require("query-string");
axios_1.default.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios_1.default.defaults.baseURL = 'https://gdcportalgw.its-mo.com';
process.on('unhandledRejection', r => console.log(r));
const initial_app_strings = 'geORNtsZe5I4lRGjG9GZiA';
const defaultRegionCode = 'NNA';
const language = 'en-US';
const tz = 'America/Denver';
const tlog = t => fp_1.default.thru(d => { console.log(t, d); return d; });
/**
 * Sleeps.
 * @param {number} ms
 * @returns {Promise<any>}
 */
function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}
/**
 * Makes a request to the API endpoint
 * @param {string} action
 * @param data
 * @returns {Promise<void>}
 */
function api(action, data) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = yield axios_1.default.post(`/gworchest_160803A/gdc/${action}.php`, querystring.stringify(data));
        if (response.data.status === 200) {
            console.log(`🍃 api ${action} 👍`);
            return response.data;
        }
        else {
            console.log(`api ${action} 👎\r\n`, response);
            throw new Error(response.data.ErrorMessage);
        }
    });
}
exports.api = api;
const blowPassword = fp_1.default.curry((key, plainpass) => {
    let cipher = crypto_1.createCipheriv('bf-ecb', key, '');
    let encpass = cipher.update(plainpass, 'utf8', 'base64');
    encpass += cipher.final('base64');
    return encpass;
});
/**
 * Returns a session id from a given vehicle info list item.
 * @param profile
 * @returns {string}
 */
function getsessionid(profile) {
    return profile.VehicleInfoList.vehicleInfo[0].custom_sessionid;
}
function getvin(profile) {
    return profile.VehicleInfoList.vehicleInfo[0].vin;
}
function getregioncode(profile) {
    return profile.CustomerInfo.RegionCode;
}
const acompose = (fn, ...rest) => {
    if (rest.length) {
        return (...args) => __awaiter(this, void 0, void 0, function* () { return fn(yield acompose(...rest)(...args)); });
    }
    else {
        return fn;
    }
};
const performChallenge = acompose(responseResult => responseResult.baseprm, () => api('InitialApp', { initial_app_strings }));
// rawCredentials => apiCredentials
const generateCredentials = (UserId, password, RegionCode = defaultRegionCode) => __awaiter(this, void 0, void 0, function* () {
    return fp_1.default.compose(Password => ({ UserId, Password, RegionCode }), blowPassword(yield performChallenge()))(password);
});
// apiCredentials => profile
const performUserLogin = (credentials) => __awaiter(this, void 0, void 0, function* () {
    return yield api('UserLoginRequest', Object.assign({ initial_app_strings }, credentials));
});
// rawCredentials => profile
const performAuthentication = acompose(performUserLogin, generateCredentials);
// rawCredentials => (apioperation => apiresults)
/**
 * Logs in and creates a session.
 * @type {Function}
 */
exports.loginSession = acompose(sessionRequest => (action) => __awaiter(this, void 0, void 0, function* () { return yield api(action, Object.assign({}, sessionRequest)); }), resultResponse => ({ custom_sessionid: getsessionid(resultResponse), VIN: getvin(resultResponse), RegionCode: getregioncode(resultResponse) }), //transforms auth response.
performAuthentication);
/**
 * Returns a result after waiting for 5000ms and a callback.
 */
const polledResult = fp_1.default.curry((session, action, resultKey) => __awaiter(this, void 0, void 0, function* () {
    let result;
    do {
        //sleep and make a request.
        yield sleep(5000);
        result = yield session(action, { resultKey });
    } while (result.responseFlag !== '1');
    return result;
}));
/**
 * Makes a request for the action, and then keeps polling for the polledAction to complete.
 */
const longPolledRequest = fp_1.default.curry((action, polledAction, session) => {
    return acompose(polledResult(session, polledAction), actionResponseResult => actionResponseResult.resultKey, () => session(action))();
});
exports.batteryRecords = (session) => session('BatteryStatusRecordsRequest');
exports.batteryStatusCheckRequest = (session) => session('BatteryStatusCheckRequest');
exports.batteryStatusCheck = (session) => longPolledRequest('BatteryStatusCheckResultRequest', 'BatteryStatusCheckResultRequest', session);
exports.hvacOn = (session) => longPolledRequest('ACRemoteRequest', 'ACRemoteResult', session);
exports.hvacOff = (session) => longPolledRequest('ACRemoteOffRequest', 'ACRemoteOffResult', session);
exports.hvacStatus = (session) => session('RemoteACRecordsRequest');
//experimental, for homebridge-carwings.
exports.authenticateAndBatteryStatusCheckRequest = (session) => longPolledRequest('UserLoginRequest', 'BatteryStatusCheckRequest', session);
