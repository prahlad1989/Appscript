function myFunction() {

    let inputSheet = SpreadsheetApp.getActive().getSheetByName("Inputs");
    let outputSheet = SpreadsheetApp.getActive().getSheetByName("Export");
    let results = fetchResults(inputSheet,outputSheet);
    updateSheet(outputSheet, results);

}

function metaDataFunction(url, startDate, endDate) {
    //https://api.pushshift.io/reddit/search/submission/?subreddit=borrow&metadata=true&size=0&after=1283246800
    //url += "&metadata=true&size=1000";
    url = url.replace("size=1000", "size=0");
    if (endDate) {
        url += "&before=" + endDate;
    }
    if (startDate) {
        url += "&after=" + startDate;
    }
    console.log("metadata url %s", url);
    let metaDataResponse = UrlFetchApp.fetch(url).getContentText();
    if (typeof(metaDataResponse) == 'string') {
        metaDataResponse = JSON.parse(metaDataResponse);
    }
    console.log("meta results: %s", metaDataResponse.metadata.total_results);
    return metaDataResponse.metadata.total_results;

};

function applyParamsFunction(url, typeOfExport, username, subredditName, fiedsToInclude) {

    let recordsProcessedTill = SpreadsheetApp.getActive().getSheetByName("Aux").getRange("b1").getValue();
    url = url + typeOfExport + "\/?";
    if (username)
        url += '&author=' + username;
    if (subredditName)
        url += '&subreddit=' + subredditName;
    url += "&metadata=true&size=1000";
    let fiedsToIncludeString = fiedsToInclude.toString().replace("[", "").replace("]", "");

    //console.log(" fields to include %s", fiedsToIncludeString);
    url += "&fields=" + fiedsToIncludeString;
    return url;
}

function formatResult(results, fiedsToInclude) {
    let setTest = new Set();
    results = results.map(function (result) {
        entries = [];
        fiedsToInclude.forEach(function (fieldName) {
            if (result[fieldName] == undefined)
                entries.push(' ');
            else
                entries.push(result[fieldName]);
        });

        if (entries.length < 12)
            console.log(entries);
        setTest.add(entries.length);
        return entries;
    });
    console.log("set %s", Array.from(setTest));
    return results;
}

function fetchResults(inputSheet, outputSheet) {
    console.log("called first");

    let typeOfExport = inputSheet.getRange("e2").getValue();
    console.log("type of export %s", typeOfExport);

    typeOfExport = typeOfExport.match(/comments/g) ? 'comment' : 'submission'
        let subredditName = inputSheet.getRange("e4") ? inputSheet.getRange("e4").getValue().trim() : undefined;
    let username = inputSheet.getRange("e5") ? inputSheet.getRange("e5").getValue().trim() : undefined;
    if (!subredditName && !username) {
        SpreadsheetApp.getUi().alert("Enter username or subredditname");
        return;
    }

    console.log("typeof export %s subredditname %s username %s", typeOfExport, subredditName, username);
    let fiedsToInclude = [];

    if (typeOfExport == 'submission') {
        fiedsToInclude = inputSheet.getRange(15, 2, 57, 2).getValues().filter(function (x) {
            return x[0];
        }).map(function (x) {
            return x[1];
        });
    } else {
        fiedsToInclude = inputSheet.getRange(15, 7, 33, 2).getValues().filter(function (x) {
            return x[0];
        }).map(function (x) {
            return x[1];
        });
    }

    let baseUrl = "https:\/\/api.pushshift.io\/reddit\/search\/";
    console.log("current url %s", baseUrl);
    let url = applyParamsFunction(baseUrl, typeOfExport, username, subredditName, fiedsToInclude);

    console.log("after params url %s", url);

    //console.log("meta data %s",metadata);

    let startDate = undefined;
    let endDate = undefined;
    let fullOrPartial = inputSheet.getRange("e7").getValue().trim();
    if (fullOrPartial = "Partial") {
        startDate = inputSheet.getRange("e9").getValue().getTime() / 1000;
        endDate = inputSheet.getRange("e10").getValue().getTime() / 1000;
    }
    let metadata = metaDataFunction(url, startDate, endDate);
    let rowsAvailable = Math.floor((5000000 / fiedsToInclude.length) - outputSheet.getLastRow() - 1);

    let resultsAcc = {
        "rows": []
    };

    resultsAcc = fetchResultsSub(inputSheet, url, resultsAcc, new Date().getTime(), rowsAvailable, startDate, endDate, metadata);
    resultsAcc.rows = formatResult(resultsAcc.rows, fiedsToInclude);

    resultsAcc.headers = fiedsToInclude;
    return resultsAcc;

    //console.log("results ",results);

    //return fetchResultsSub(query, [], new Date().getTime());
}

function fetchResultsSub(inputSheet, url, resultsAccum, tic, rowsAvailable, startDate, endDate, metadata) {
    let finalUrl = url;
    if (endDate) {
        finalUrl += "&before=" + endDate;
    }
    if (startDate) {
        finalUrl += "&after=" + startDate;
    }

    console.log("url is %s", finalUrl);
    let toc = new Date().getTime();
    if ((toc - tic) / 1000 > 4) {
        return resultsAccum;
    } else if (endDate && startDate && endDate <= startDate) {
        resultsAccum.status = "Completed";
        return resultsAccum;
    } else {

        let queryResult = UrlFetchApp.fetch(finalUrl).getContentText();
        console.log("type of %s", typeof(queryResult));
        if (typeof(queryResult) == 'string') {
            queryResult = JSON.parse(queryResult);
        }
        let data = queryResult.data;
        console.log("data got  %s", data.length);
        if (!data || data.length == 0) {
            resultsAccum.status = "Completed";
            return resultsAccum;
        }
        resultsAccum.rows = resultsAccum.rows.concat(queryResult.data);
        let lastCreatedUTC = data[data.length - 1].created_utc;

        //let match=url.match(/before\=(\d+)/i);
        //url=(match && match.length>0)?url.replace(/before\=(\d+)/i,"before="+lastCreatedUTC):(url+"&before="+lastCreatedUTC)
        //console.log("time taken for this query %s accumlated %s , result size ", (new Date().getTime() - queryStart) / 1000, (new Date().getTime() - tic) / 1000, accum.length);
        return fetchResultsSub(inputSheet, url, resultsAccum, tic, rowsAvailable, startDate, lastCreatedUTC - 1);

    }

}

function updateSheetExp(sheet, data) {
    sheet.clear();
    sheet.clearFormats();
    sheet.clearNotes();
    if (sheet.getLastRow() == 0) {
        sheet.appendRow(data.headers);
    }
    sheet.getRange(1, 1, 1, sheet.getMaxColumns()).setFontStyle("bold");

    sheet.getRange(sheet.getLastRow() + 1, 1, data.rows.length, data.headers.length).setValues(data.rows);
    if (data.isCompleted == true) {
        SpreadsheetApp.getActive().getSheetByName("Inputs").getRange("h9").setValue("Completed").setFontColor("green");

    } else if (data.isCompleted == false) {
        SpreadsheetApp.getActive().getSheetByName("Inputs").getRange("h9").setValue("Run Again").setFontColor("red")
    }

}

function updateSheet(sheet, data) {
    sheet.clear();
    sheet.clearFormats();
    sheet.clearNotes();
    if (sheet.getLastRow() == 0) {
        sheet.appendRow(data.headers);
    }

    rowsAvailable = Math.floor((5000000 / data.headers.length) - sheet.getLastRow() - 1 - 1000);
    if(rowsAvailable <  data.rows.length){
      data.rows=data.rows.slice(0,rowsAvailable);
      sheet.getRange(sheet.getLastRow() + 1, 1, data.rows.length, data.headers.length).setValues(data.rows);
      //SpreadsheetApp.getActive().getSheetByName("Inputs").getRange("h9").setValue("Completed").setFontColor("green");
    }

    sheet.getRange(1, 1, 1, sheet.getMaxColumns()).setFontStyle("bold");

    sheet.getRange(sheet.getLastRow() + 1, 1, data.rows.length, data.headers.length).setValues(data.rows);
//    if (data.status == "Completed") {
//        SpreadsheetApp.getActive().getSheetByName("Inputs").getRange("h9").setValue("Completed").setFontColor("green");
//
//    } else if (data.status == "RunAgain") {
//        rowsAvailable = Math.floor((5000000 / data.headers.length) - sheet.getLastRow() - 1 - 1000);
//        if(rowsAvailable<1000)SpreadsheetApp.getActive().getSheetByName("Inputs").getRange("h9").setValue("Completed").setFontColor("green");
//        SpreadsheetApp.getActive().getSheetByName("Inputs").getRange("h9").setValue("Run Again").setFontColor("red")
//    }

}
