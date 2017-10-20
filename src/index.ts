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

function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}

export async function api(action:string, data: any) {
  let response = await axios.post(`/gworchest_160803A/gdc/${action}.php`, querystring.stringify(data));

  if(response.data.status === 200) {
    console.log(`🍃 api ${action} 👍`);
    return response.data;
  } else {
    console.log(`api ${action} 👎\r\n`, response);
    throw new Error(response.data.ErrorMessage);
  }
}

const blowpassword = _.curry((key:string, plainpass:string): string => {
  let cipher = createCipheriv('bf-ecb', key, '');

  let encpass = cipher.update(plainpass, 'utf8', 'base64');
  encpass += cipher.final('base64');

  return encpass;
});

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
  return rest.length
    ? async (...args) =>
      fn(await acompose(...rest)(...args))
    : fn;
};


const challenge = acompose(
  r => r.baseprm,
  () => api('InitialApp', { initial_app_strings }),
);



// rawCredentials => apiCredentials
const genCredentials = async (UserId:string, password : string, RegionCode: string = defaultRegionCode) => {
  return _.compose(
    Password => ({ UserId, Password, RegionCode }),
    blowpassword(await challenge()),
  )(password);
};

// apiCredentials => profile
const userLogin = async (credentials) => {
  return await api('UserLoginRequest', {
	  initial_app_strings,
    ...credentials
  });
};

// rawCredentials => profile
const authenticate = acompose(userLogin, genCredentials);

// rawCredentials => (apioperation => apiresults)
export const loginSession: ICarwingsSession = acompose(
  s => async (action) => await api(action, { ...s }),
  profile => ({ custom_sessionid: getsessionid(profile), VIN: getvin(profile), RegionCode: getregioncode(profile) }),
  authenticate,
);

const pollresult = _.curry(async (session: ICarwingsSession, action: string, resultKey: string) => {
  let result;
  do {
    await sleep(5000);
    result = await session(action, { resultKey });
  } while(result.responseFlag !== '1');

  return result;
});

const longpollrequest = _.curry((action:string, pollaction:string, session:ICarwingsSession) => {
  return acompose(
    pollresult(session, pollaction),
    r => r.resultKey,
    () => session(action),
  )();
});

export const batteryRecords = (session: ICarwingsSession) => session('BatteryStatusRecordsRequest');
export const batteryStatusCheckRequest = (session: ICarwingsSession) => session('BatteryStatusCheckRequest');
export const batteryStatusCheck = (session: ICarwingsSession) => longpollrequest('BatteryStatusCheckResultRequest', 'BatteryStatusCheckResultRequest', session);

export const hvacOn = (session: ICarwingsSession) => longpollrequest('ACRemoteRequest', 'ACRemoteResult', session);
export const hvacOff = (session: ICarwingsSession) => longpollrequest('ACRemoteOffRequest', 'ACRemoteOffResult', session);
export const hvacStatus = (session: ICarwingsSession) => session('RemoteACRecordsRequest');
