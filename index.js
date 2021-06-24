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
  var sheetsList = [
                      { name: 'Item__cs.json',
                        range: 'Items__cs!A1:J41' 
                      }, 
                      { 
                        name: 'Field_Asset__cs.json', 
                        range: 'Field_Assets_cs!A1:J88' 
                      },
                      { 
                        name: 'Resource__cs.json', 
                        range: 'Resources_cs!A1:L41' 
                      },
                      { 
                        name: 'Crew_Resource__cs.json', 
                        range: 'Crew_Resource__cs!A1:G28' 
                      },
                      { 
                        name: 'Site__cs_wm.json', 
                        range: 'Site_cs_wm!A1:N9' 
                      },
                      { 
                        name: 'Territory__cs.json', 
                        range: 'Territory_cs!A1:D9' 
                      },
                      { 
                        name: 'Calendar__cs.json', 
                        range: 'Calendar_cs!A1:F2' 
                      },
                      { 
                        name: 'Calendar_Rule__cs.json', 
                        range: 'Calendar_cs!A1:F2' 
                      },
                      { 
                        name: 'Job_Task_Template__cs.json', 
                        range: 'Job_Task_Template_cs!A1:I22' 
                      },
                      { 
                        name: 'Skill__cs.json', 
                        range: 'Skill_cs!A1:D12' 
                      },
                      { 
                        name: 'Job_Template__cs.json', 
                        range: 'Job_Template_cs!A1:I9' 
                      },
                      { 
                        name: 'Checklist_Template__cs.json', 
                        range: 'Checklist_Template_cs!A1:Q197' 
                      }
                    ];
  const sheets = google.sheets({version: 'v4', auth});
  sheetsList.map((sheetItem) => {
    sheets.spreadsheets.values.get({
        // spreadsheetId: '1RgE5yKPyFCsgfElQin3lDPD8BQdnAEgbYqD9bC3uDRU', // Trail
        spreadsheetId: '1dVa8MVYhQX4mFm5JKqFGb8HZen1qk_lGdoTQWqCwSE0', //Actual
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
            case sheetsList[2].range: //Resources
              generate_Resources_file(sheetItem.name, rows);
              break;
            case sheetsList[3].range: //Crew_Resource__cs
              generate_CrewResource_file(sheetItem.name, rows);
              break;
            case sheetsList[4].range: //Site_cs_wm
              generate_Site_CS_WM_file(sheetItem.name, rows);
              break;
            case sheetsList[5].range: //Territory_cs
              generate_Territory_cs_file(sheetItem.name, rows);
              break;
            case sheetsList[6].range: //Calendar__cs
              generate_Calendar__cs_file(sheetItem.name, rows);
              break;
            case sheetsList[7].range: //Calendar_Rule_cs
              generate_Calendar_Rule_cs_file(sheetItem.name, rows);
              break;            
            case sheetsList[8].range: //Job_Task_Template_cs
              generate_Job_Task_Template_cs_file(sheetItem.name, rows);
              break;
            case sheetsList[9].range: //Skill__cs
              generate_Skill__cs_file(sheetItem.name, rows);
              break;
            case sheetsList[10].range: //Job_Template_cs
              generate_Job_Template_cs_file(sheetItem.name, rows);
              break;
            case sheetsList[11].range: //Checklist_Template_cs
              generate_Checklist_Template_cs_file(sheetItem.name, rows);
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
            tempObject.attributes['type'] = item[1];
            tempObject.attributes['referenceId'] = item[0];
            tempObject['strk__Item_Number__c'] = item[3];
            tempObject['Name'] = item[2];
            tempObject['strk__Primary_UoM__c'] = item[5];
            tempObject['strk__Type__c'] = item[4];
            tempObject['strk__Available_For_Receipt__c'] = item[8] == "TRUE";
            tempObject['strk__Usage_Type__c'] = item[7];
            tempObject['strk__Tracking_Method__c'] = item[6];
            // tempObject['strk__Manufacturer__c'] = item[4];
            tempObject['strk__Asset_Name_Prefix__c'] = item[9];
            tempObject['strk__Asset_Name_Suffix__c'] = item[10];
            tempObject['strk__Description__c'] = item[11];
            item[12] ? tempObject['strk__Default_Container_Quantity__c'] = item[12] : '';
            tempObject['strk__Standard_Cost__c'] = parseInt(item[13]);
            tempObject['strk__Category__c'] = item[14];
            items_cs_data.records.push(tempObject);
            tempObject = { attributes: {}}
        }
      });
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
              tempObject.attributes['type'] = item[1];
              tempObject.attributes['referenceId'] = item[0];
              tempObject['strk__Status__c'] = item[9];
              tempObject['strk__Item__c'] = item[4];
              tempObject['strk__Site__c'] = item[2];
              item[5] ? tempObject['strk__Serial__c'] = item[5] : '';
              item[6] ? tempObject['strk__Parent__c'] =  item[6] : '';
              item[3] ? tempObject['Name'] =  item[3] : '';
              item[7] ? tempObject['strk__Quantity__c'] =  item[7] : '';
              item[8] ? tempObject['strk__Top_Level_Parent__c'] =  item[8] : '';
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

function generate_Resources_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[2] ? tempObject['Name'] = item[2] : '';
            item[4] ? tempObject['strk__Active__c'] = item[4] == "TRUE" : '';
            item[8] ? tempObject['strk__Calendar__c'] = item[8] : '';
            item[6] ? tempObject['strk__Territory__c'] = item[6] : '';
            item[3] ? tempObject['strk__Type__c'] =  item[3] : '';
            item[5] ? tempObject['strk__Site__c'] =  item[5] : '';
            item[9] ? tempObject['strk__Enable_Live_Location__c'] =  item[9]  == 'TRUE' : '';
            item[10] ? tempObject['strk__Enable_Resource_For__c'] =  item[10] : '';
            item[7] ? tempObject['strk__Resource_Skill__c'] =  item[7] : '';
            item[11] ? tempObject['strk__Field_Asset__c'] =  item[11] : '';
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

function generate_CrewResource_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[2] ? tempObject['strk__Crew__c'] = item[2] : '';
            item[3] ? tempObject['strk__Resource__c'] = item[3] : '';
            item[4] ? tempObject['strk__Role__c'] = item[4] : '';
            item[5] ? tempObject['strk__Site__c'] = item[5] : '';
            item[6] ? tempObject['strk__Resource_Skill__c'] = item[6] : '';
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

function generate_Site_CS_WM_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[12] ? tempObject['strk__Zip_Code__c'] = item[11] : '';
            item[4] ? tempObject['strk__Street_Address__c'] = item[4] : '';
            item[10] ? tempObject['strk__State__c'] = item[10] : '';
            item[8] ? tempObject['strk__Site_Status__c'] = item[8] : '';
            item[9] ? tempObject['strk__Site_Type__c'] = item[9] : '';
            item[13] ? tempObject['strk__Territory__c'] = item[12] : '';
            item[2] ? tempObject['Name'] = item[2] : '';
            item[6] ? tempObject['strk__Long__c'] = item[6] : '';
            item[7] ? tempObject['strk__Site_Description__c'] = item[7] : '';
            item[5] ? tempObject['strk__Lat__c'] = item[5] : '';
            item[3] ? tempObject['strk__City__c'] = item[3] : '';
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

function generate_Territory_cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[2] ? tempObject['Name'] = item[2] : '';
            item[3] ? tempObject['strk__Type__c'] = item[3] : '';
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

function generate_Calendar__cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[2] ? tempObject['strk__Description__c'] = item[2] : '';
            item[4] ? tempObject['strk__Treat_Unspecified_Time_As__c'] = item[4] : '';
            item[3] ? tempObject['Name'] = item[3] : '';
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

function generate_Calendar_Rule_cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[2] ? tempObject['strk__Calendar__c'] = item[2] : '';
            item[3] ? tempObject['strk__Days__c'] = item[3] : '';
            item[4] ? tempObject['Name'] = item[4] : '';
            item[5] ? tempObject['strk__Description__c'] = item[5] : '';
            item[6] ? tempObject['strk__Start_Time__c'] = item[6] : '';
            item[7] ? tempObject['Nastrk__End_Time__cme'] = item[7] : '';
            item[8] ? tempObject['strk__Type__c'] = item[8] : '';
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

function generate_Skill__cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[3] ? tempObject['Name'] = item[3] : '';
            item[2] ? tempObject['strk__Type__c'] = item[2] : '';
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

function generate_Job_Task_Template_cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[5] ? tempObject['strk__Description__c'] = item[5] : '';
            item[3] ? tempObject['strk__Job_Template__c'] = item[3] : '';
            item[7] ? tempObject['strk__Required__c'] = item[7] == "TRUE" : '';
            item[2] ? tempObject['Name'] = item[2] : '';
            item[6] ? tempObject['strk__Estimated_Duration__c'] = parseInt(item[6]) : '';
            item[4] ? tempObject['strk__Order__c'] = parseInt(item[4]) : '';
            item[8] ? tempObject['strk__Checklist_Template__c'] = item[8] : '';
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

function generate_Job_Template_cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject = { attributes: {}};
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            item[2] ? tempObject['Name'] = item[2] : '';
            item[3] ? tempObject['strk__Job_Type__c'] = item[3] : '';
            item[4] ? tempObject['strk__Estimated_Duration__c'] = parseInt(item[4]) : '';
            item[5] ? tempObject['strk__Duration_Unit__c'] = item[5] : '';
            item[6] ? tempObject['strk__Job_Item_Templates__c'] = item[6] : '';
            item[7] ? tempObject['strk__Job_Skill_Templates__c'] = item[7] : '';
            item[8] ? tempObject['strk__Active__c'] = item[8] == "TRUE" : '';
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

function generate_Checklist_Template_cs_file(filename, data) {
  var field_assets_data = { records : []};
  var tempObject;
  var checkListObject;
  try {
    data.map((item, index) => {
        if(index != 0) {
            tempObject = { attributes: {}, Name: '' , strk__Checklist_Item_Templates__r : {records : []}};
            tempObject.attributes['type'] = item[0];
            tempObject.attributes['referenceId'] = item[1];
            if(item[2] != null && item[2] !== '') { // If Name is not null
              var doesRecordExists = false;
              checkListObject = {attributes: { type: '', referenceId: ''}};
              tempObject['Name'] = item[2];
              checkListObject.attributes.type = item[3];
              checkListObject.attributes.referenceId =  item[4];
              item[5] ? checkListObject['strk__Description__c'] = item[5] : '';
              item[6] ? checkListObject['strk__Order__c'] = parseInt(item[6]) : '';
              item[7] ? checkListObject['strk__Field_Type__c'] = item[7] : '';
              item[8] ? checkListObject['strk__Section__c'] = item[8] : '';
              item[9] ? checkListObject['strk__Subsection__c'] = item[9] : '';
              item[10] ? checkListObject['strk__Picklist_Options__c'] = item[10] : '';
              item[11] ? checkListObject['strk__Photo_Required__c'] = item[11] == 'TRUE' || item[11] == 'Y' : '';
              item[12] ? checkListObject['strk__Read_Only__c'] = item[12] == "TRUE" : '';
              item[13] ? checkListObject['strk__Optional__c'] = item[13] == "TRUE" : '';
              item[14] ? checkListObject['strk__Geofencing_Required__c'] = item[14] == "TRUE" : '';
              item[15] ? checkListObject['strk__Comment_Required__c'] = item[15] : '';
              item[16] ? checkListObject['strk__Field_Reference__c'] = item[16] : '';
              field_assets_data.records.map((checkListItem, index) => {
                if(checkListItem.Name == item[2]) { // If Checklist exist add a record 
                  doesRecordExists = true;
                  field_assets_data.records[index].strk__Checklist_Item_Templates__r.records.push(checkListObject);
                }
              });
              if(!doesRecordExists) { // If Checklist doesn't exist create new one and add record
                tempObject.strk__Checklist_Item_Templates__r.records.push(checkListObject);
                field_assets_data.records.push(tempObject);
              }
            }
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