const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const fileLocation = getArgs().location== 'remote' ? '../../Sitetracker/develop_repo/data/wm/': 'data/';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), generateData);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Generates json files for each sheet in the spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * Make sure to publish the sheet to web before you try to read the data
 * If you see a 401 error or api error in fetching data, check the below thread
 * @see https://stackoverflow.com/questions/37315266/google-sheets-api-v4-receives-http-401-responses-for-public-feeds
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function generateData(auth) {
  var sheetsList = [{ name: 'Item__cs.json', range: 'Items__cs!A14:H54' }, { name: 'Field_Asset__cs.json', range: 'Field_Assets__cs!A1:E88' }];
  const sheets = google.sheets({version: 'v4', auth});
  sheetsList.map((sheetItem) => {
    sheets.spreadsheets.values.get({
        // spreadsheetId: '1RgE5yKPyFCsgfElQin3lDPD8BQdnAEgbYqD9bC3uDRU', // Trail
        spreadsheetId: '1KgvoUgn3i4Eg-mhe-3sTlx48CtObzHU1HGyyxydt7C8', //Actual
        range: sheetItem.range,
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
          switch(sheetItem.range) {
            case sheetsList[0].range: //ItemsCS
              generate_ItemsCS_file(sheetItem.name, rows);
              break;
            case sheetsList[1].range: //FieldAssets
              generate_FieldAssets_file(sheetItem.name, rows);
              break;
            default:
              console.log('No data found.');
          }
        } else {
          console.log('No data found.');
        }
      });
  })  
}

function generate_ItemsCS_file(filename, data) {
    var items_cs_data = { records : []};
    var tempObject = { attributes: {}};
    try {
      data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = 'strk__Item__c';
            tempObject.attributes['referenceId'] = '';
            tempObject['Name'] = item[0];
            tempObject['strk__Item_Number__c'] = item[1];
            tempObject['strk__Type__c'] = item[3];
            tempObject['strk__Primary_UoM__c'] = item[4];
            tempObject['strk__Tracking_Method__c'] = item[2];
            tempObject['strk__Usage_Type__c'] = item[5];
            tempObject['strk__Available_For_Receipt__c'] = item[6];
            items_cs_data.records.push(tempObject);
            tempObject = { attributes: {}}
        }
      });
      var data = JSON.stringify(items_cs_data);
      fs.writeFileSync(fileLocation + filename, data);
      console.log(filename, ' is generated!');
    } catch {
      console.error(filename, 'failure');
    }   
}

function generate_FieldAssets_file(filename, data) {
    var field_assets_data = { records : []};
    var tempObject = { attributes: {}};
    try {
      data.map((item, index) => {
          if(index != 0) {
              tempObject.attributes['type'] = 'strk__Field_Asset__c';
              tempObject.attributes['referenceId'] = '';
              tempObject['strk__Status__c'] = item[0];
              tempObject['strk__Item__c'] = item[1];
              tempObject['strk__Site__c'] = item[2];
              tempObject['strk__Serial__c'] = item[3] ? item[3] : '';
              tempObject['strk__Parent__c'] = item[4] ? item[4] : '';
              field_assets_data.records.push(tempObject);
              tempObject = { attributes: {}}
          }
      });
      var data = JSON.stringify(field_assets_data);
      fs.writeFileSync( fileLocation + filename, data);
      console.log(filename, ' is generated!');
    } catch {
      console.error(filename, 'failure');
    }
}

function getArgs () {
  const args = {};
  process.argv
      .slice(2, process.argv.length)
      .forEach( arg => {
      // long arg
      if (arg.slice(0,2) === '--') {
          const longArg = arg.split('=');
          const longArgFlag = longArg[0].slice(2,longArg[0].length);
          const longArgValue = longArg.length > 1 ? longArg[1] : true;
          args[longArgFlag] = longArgValue;
      }
      // flags
      else if (arg[0] === '-') {
          const flags = arg.slice(1,arg.length).split('');
          flags.forEach(flag => {
          args[flag] = true;
          });
      }
  });
  return args;
}
const args = getArgs();
console.log(args);