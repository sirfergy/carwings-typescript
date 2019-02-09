import { createCipheriv } from 'crypto';
import * as _ from "lodash/fp";
import axios from 'axios';
import * as querystring from 'query-string';

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.baseURL = 'https://gdcportalgw.its-mo.com';

process.on('unhandledRejection', r => console.log(r));
const initial_app_strings:string = 'geORNtsZe5I4lRGjG9GZiA';
const defaultRegionCode:string = 'NNA';
const language:string = 'en-US';
const tz = 'America/Denver';

const tlog = t => _.thru(d => { console.log(t, d); return d; });

export interface ICarwingsSession extends Function{
}

export class CarwingsAuthenticator {
  username: string;
  password: string;
  regionCode: string;

  constructor(username, password, regionCode) {
    var base64regex = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;
    this.username = username;
    this.password = password;
    this.regionCode = regionCode;

    // This test fails if password is not simple words. Skip for now
    // if(base64regex.test(this.password)){
    //   var buff = Buffer.from(password);
    //   this.password = buff.toString('base64');
    // }

  }

  async login(): Promise<ICarwingsSession>{
    let session = await loginSession(this.username, this.password, this.regionCode);
    return session;
  }

  async validateSession(session: ICarwingsSession, authenticated = true): Promise<ICarwingsSession>{
    let validatedSession = session;
    //console.log('checkIfAuthenticated');
    if (typeof validatedSession !== "function") {
      authenticated = false;
    }
    if(!authenticated) {
      validatedSession = await this.login();
    }
    return validatedSession;
  }

}

export interface ICarwingsCheckStatus {
  status: number;
}


/**
 * Sleeps.
 * @param {number} ms
 * @returns {Promise<any>}
 */
function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Makes a request to the API endpoint
 * @param {string} action
 * @param data
 * @returns {Promise<void>}
 */
export async function api(action:string, data: any) {
  let response = await axios.post(`/gworchest_160803EC/gdc/${action}.php`, querystring.stringify(data));

  if(response.data.status === 200) {
    //console.log(`🍃 api DATA ${action} 👍`, data);
    //console.log(`🍃 api ${action} 👍`, response.data);
    return response.data;
  } else {

    if(response.data && response.data.status === 401) {
      // Send back 401 response so it can be handled.
      //console.log('Carwings Status 401');
      return response.data;
    } else {
      //console.log(`api ${action} 👎\r\n`, response);
      throw new Error(response.data.ErrorMessage);
    }

  }
}

const blowPassword = _.curry((key:string, plainpass:string): string => {
  let cipher = createCipheriv('bf-ecb', key, '');

  let encpass = cipher.update(plainpass, 'utf8', 'base64');
  encpass += cipher.final('base64');

  return encpass;
});

/**
 * Returns a session id from a given vehicle info list item.
 * @param profile
 * @returns {string}
 */
function getsessionid(profile):string {
  //console.log("LOGIN", profile);
  if (profile && profile.vehicleInfo && profile.vehicleInfo[0]) {
    return profile.vehicleInfo[0].custom_sessionid;
  }
  else if (profile && profile.VehicleInfoList && profile.VehicleInfoList.vehicleInfo[0]) {
    return profile.VehicleInfoList.vehicleInfo[0].custom_sessionid;
  } else {
    return null;
  }
}

function getvin(profile):string {
  if (profile && profile.vehicleInfo && profile.vehicleInfo[0]) {
    return profile.vehicleInfo[0].vin;
  }
  else if (profile && profile.VehicleInfoList && profile.VehicleInfoList.vehicleInfo[0]) {
    return profile.VehicleInfoList.vehicleInfo[0].vin;
  } else {
    return null;
  }
}

function getregioncode(profile): string {
	return profile.CustomerInfo.RegionCode;
}

const acompose = (fn?: Function, ...rest) : Function => {
  if (rest.length) {
    return async (...args) => fn(await acompose(...rest)(...args));
  } else { //if there are no arguments.
    return fn;
  }
};

const performChallenge = acompose(
  responseResult => responseResult.baseprm,
  () => api('InitialApp', { initial_app_strings }),
);

// rawCredentials => apiCredentials
const generateCredentials = async (UserId:string, password : string, RegionCode: string = defaultRegionCode) => {
  return _.compose(
    Password => ({ UserId, Password, RegionCode }),
    blowPassword(await performChallenge()),
  )(password);
};

// apiCredentials => profile
const performUserLogin = async (credentials) => {
  return await api('UserLoginRequest', {
	  initial_app_strings,
    ...credentials
  });
};

// rawCredentials => profile
const performAuthentication = acompose(performUserLogin, generateCredentials);

// rawCredentials => (apioperation => apiresults)
/**
 * Logs in and creates a session.
 * @type {Function}
 */
export const loginSession: ICarwingsSession = acompose(
  sessionRequest => async (action) => await api(action, { ...sessionRequest }),
  resultResponse => ({
    custom_sessionid: getsessionid(resultResponse),
    VIN: getvin(resultResponse),
    RegionCode: getregioncode(resultResponse) }), //transforms auth response.
  performAuthentication, //performs authentication
);

/**
 * Returns a result after waiting for 5000ms and a callback.
 */
const polledResult = _.curry(async (session: ICarwingsSession, action: string, resultKey: string) => {
  let result;
  //console.info("ResultKey 🔑", resultKey);
  //console.info("action ", action);
  do {
    //sleep and make a request.
    await sleep(5000);
    result = await session(action, { resultKey });
    //console.log('POLLED result', result);
  } while(result.responseFlag !== '1');

  return result;
});

/**
 * Makes a request for the action, and then keeps polling for the polledAction to complete.
 */
const longPolledRequest = _.curry(async (action:string, polledAction:string, session:ICarwingsSession) => {
  //console.info("⏰  making a long polled request..." + action + ' ' + polledAction);
  let result = await acompose(
     polledResult(session, polledAction),
    actionResponseResult => actionResponseResult.resultKey,
    () => session(action),
  )();
  return result;
});

// const longPolledRequest = _.curry(async (action:string, polledAction:string, session:ICarwingsSession) => {
//   console.info("⏰  making a long polled request..." + action + ' ' + polledAction);
//   return acompose(
//     await polledResult(session, polledAction),
//     actionResponseResult => actionResponseResult.resultKey,
//     () => session(action),
//   );
// });

export const batteryRecords = (session: ICarwingsSession) => session('BatteryStatusRecordsRequest');
export const batteryStatusCheckRequest = (session: ICarwingsSession) => session('BatteryStatusCheckRequest');
export const batteryStatusCheck = (session: ICarwingsSession) => longPolledRequest('BatteryStatusCheckRequest', 'BatteryStatusCheckResultRequest', session);
export const batteryChargingRequest = (session: ICarwingsSession) => session('BatteryRemoteChargingRequest');

export const hvacOn = (session: ICarwingsSession) => session('ACRemoteRequest');
export const hvacOff = (session: ICarwingsSession) => session('ACRemoteOffRequest');
export const hvacStatus = (session: ICarwingsSession) => session('RemoteACRecordsRequest');
