# gsheettojsongenerator

This tool will let you read your google sheet data and would generate the json files 


## Usage
To run the code you need to execute the below script

```bash
    node . --location=remote
```

Here @param location is used to decide whether the data should be generated locally or update the develop repo (remote) with data files

## Points to be noted 
1. Whenever there is a change in the data range of a particular sheet. Update them in the sheetList array 
2. If reading the sheet is not successful, make sure you published the sheet to web. 