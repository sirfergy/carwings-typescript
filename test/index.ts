
//Create the api session
//done already.

// import {loginSession, batteryRecords, hvacOff, hvacOn} from "../src/index";
//
// (async function() {
// let session = await loginSession('bobbytables@gmail.com', 'Tr0ub4dor&3');
//
// let data = await batteryRecords(session);

// let data = await hvacOn(session);

// let carsession = data => session({ ...data, profile.VehicleInfoList.vehicleInfo[0].vin });

/*
data = await api('InitialApp', {
  initial_app_strings
});
const key = data.baseprm;

data = await api('UserLoginRequest', {
  RegionCode,
  UserId: 'email@example.com',
  Password: blowpassword('Tr0ub4dor&3', key),
  initial_app_strings
});
*/

/*
data = await api('BatteryStatusRecordsRequest', {
  RegionCode,
  VIN,
  custom_sessionid
});
*/

/*
data = await api('BatteryStatusCheckRequest', {
  RegionCode,
  VIN,
  custom_sessionid
});
*/

/*
data = await api('BatteryStatusCheckResultRequest', {
  RegionCode,
  VIN,
  resultKey: '5fF06yLeE2U5ENi06AAr5LqO285oMuWrzCIWb3aFVVkAItapUA',
  custom_sessionid
});
*/

/*
data = await api('RemoteACRecordsRequest', {
  RegionCode,
  VIN,
  custom_sessionid,
  tz
});
*/

/*
data = await api('GetScheduledACRemoteRequest', {
  RegionCode,
  VIN,
  custom_sessionid,
  tz // untested
});
*/

/*
data = await api('ACRemoteRequest', {
  RegionCode,
  VIN,
  custom_sessionid
});
let resultKey = data.resultKey;
console.log(`start dispatched ${resultKey}`);

do {
  await sleep(5000);
  console.log(`polling for start`);

  data = await api('ACRemoteResult', {
    RegionCode,
    VIN,
    custom_sessionid,
    resultKey
  });
} while(data.responseFlag !== '1')
*/

/*
data = await api('ACRemoteOffRequest', {
  RegionCode,
  VIN,
  custom_sessionid
});
let resultKey = data.resultKey;
console.log(`stop dispatched ${resultKey}`);

do {
  await sleep(5000);
  console.log(`polling for stop`);

  data = await api('ACRemoteOffResult', {
    RegionCode,
    VIN,
    custom_sessionid,
    resultKey
  });
} while(data.responseFlag !== '1')
*/

//
// console.log(data);
// }());
