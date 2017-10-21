import { createCipheriv } from 'crypto';
import _ from 'lodash/fp';
import axios from 'axios';
import * as querystring from 'query-string';

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.baseURL = 'https://gdcportalgw.its-mo.com';

process.on('unhandledRejection', r => console.log(r));
export interface ICarwingsSession extends Function{
}

const initial_app_strings:string = 'geORNtsZe5I4lRGjG9GZiA';
const defaultRegionCode:string = 'NNA';
const language:string = 'en-US';
const tz = 'America/Denver';

const tlog = t => _.thru(d => { console.log(t, d); return d; });

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
  let response = await axios.post(`/gworchest_160803A/gdc/${action}.php`, querystring.stringify(data));

  if(response.data.status === 200) {
    console.log(`🍃 api ${action} 👍`);
    return response.data;
  } else {

    if(response.data.status === 401) {
      // Send back 401 response so it can be handled.
      console.log('Carwings Status 401');
      return response.data;
    } else {
    console.log(`api ${action} 👎\r\n`, response);
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
function getsessionid(profile): string {
  return profile.VehicleInfoList.vehicleInfo[0].custom_sessionid;
}

function getvin(profile): string {
  return profile.VehicleInfoList.vehicleInfo[0].vin;
}

function getregioncode(profile): string {
	return profile.CustomerInfo.RegionCode;
}

const acompose = (fn?, ...rest) : Function => {
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
  resultResponse => ({ custom_sessionid: getsessionid(resultResponse), VIN: getvin(resultResponse), RegionCode: getregioncode(resultResponse) }), //transforms auth response.
  performAuthentication, //performs authentication
);

/**
 * Returns a result after waiting for 5000ms and a callback.
 */
const polledResult = _.curry(async (session: ICarwingsSession, action: string, resultKey: string) => {
  let result;
  do {
    //sleep and make a request.
    await sleep(5000);
    result = await session(action, { resultKey });
  } while(result.responseFlag !== '1');

  return result;
});

/**
 * Makes a request for the action, and then keeps polling for the polledAction to complete.
 */
const longPolledRequest = _.curry((action:string, polledAction:string, session:ICarwingsSession) => {
  return acompose(
    polledResult(session, polledAction),
    actionResponseResult => actionResponseResult.resultKey,
    () => session(action),
  )();
});

export const batteryRecords = (session: ICarwingsSession) => session('BatteryStatusRecordsRequest');
export const batteryStatusCheckRequest = (session: ICarwingsSession) => session('BatteryStatusCheckRequest');
export const batteryStatusCheck = (session: ICarwingsSession) => longPolledRequest('BatteryStatusCheckResultRequest', 'BatteryStatusCheckResultRequest', session);

export const hvacOn = (session: ICarwingsSession) => longPolledRequest('ACRemoteRequest', 'ACRemoteResult', session);
export const hvacOff = (session: ICarwingsSession) => longPolledRequest('ACRemoteOffRequest', 'ACRemoteOffResult', session);
export const hvacStatus = (session: ICarwingsSession) => session('RemoteACRecordsRequest');

//experimental, for homebridge-carwings.
export const authenticateAndBatteryStatusCheckRequest = (session: ICarwingsSession) => longPolledRequest('UserLoginRequest','BatteryStatusCheckRequest', session);
