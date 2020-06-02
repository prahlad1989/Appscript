function onOpen() {
    var ui = SpreadsheetApp.getUi().createMenu('TikTok')
        .addItem('Get Followers', 'myFunction')
        .addToUi();

}

function myFunction() {
    tic = new Date().getTime() / (1000);
    let sheet = SpreadsheetApp.getActive().getSheetByName("Main");
    let tiktokIDs = [];
    //let queryLimit=Math.min(100,sheet.getLastRow()-1);

    let headerRow = 1;
    let firstEmptyRow = 2;
    range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();

    for (i = 0; i < range.length; i++) {
        let eachRow = range[i];
        let name = eachRow[0];
        let output = eachRow[1];
        if (name && output == undefined || output.toString().length == 0) {
            firstEmptyRow = 2 + i;
            break;
        }

    }
    //console.log("first empty row %s",firstEmptyRow);
    let queryLimit = Math.min(100, sheet.getLastRow() + 1 - firstEmptyRow);
    sheet.getRange(firstEmptyRow, 1, queryLimit).getValues().forEach(function (eachRow, index) {
        let name = eachRow[0];
        if(name){
        let tiktokId = gettiktokFromGoogleLink(name);
        tiktokIDs.push([tiktokId]);
        }else{
        tiktokIDs.push([' ']);
        }
        
        let toc = new Date().getTime() / (1000);
        if (toc - tic > 300)
            return false;

    });

    sheet.getRange(firstEmptyRow, 2, queryLimit).setValues(tiktokIDs);
    sheet.getRange(firstEmptyRow, 2, queryLimit).setNumberFormat("#,##0");

}

function gettiktokFromGoogleLink(name) {
    console.log("user %s", name);
    let query = "https://customsearch.googleapis.com/customsearch/v1?cx=004825631910536612511:mwmvck3x8cx&q=" + name + " tiktok&key=AIzaSyBifTW-5nVmRt3rZ49mUPXxSUhHLgr_zZc&num=5";
    console.log(query);
    let searchResult = UrlFetchApp.fetch(query);
    console.log(searchResult);
    let tiktokId = '';
    searchResult = JSON.parse(searchResult);

    for (let i = 0; searchResult.items && i < searchResult.items.length; i++) {
        let item = searchResult.items[i];
        //console.log("link %s,%s,%s",item.link,item.link.match(/https:\/\/www.tiktok.com\/@(.*)/i) ,item.link.match(/https:\/\/www.tiktok.com\/@(.*)?lang=/i));
        //linkMatch=item.link.match(/https:\/\/www.tiktok.com\/@(.*)/i) |item.link.match(/https:\/\/www.tiktok.com\/@(.*)?lang=/i);
        console.log("each item link %s", item.link);
        console.log("each item snippet %s", item.snippet);
        let linkMatch = item.link.match(/https:\/\/www.tiktok.com\/@([^\/])+/i);
        if (!linkMatch) {
            linkMatch = item.link.match(/https:\/\/www.tiktok.com\/@([^\/])+?lang=/i)
        }
        console.log("link matched %s", linkMatch);
        if (linkMatch && linkMatch.length > 0) {
            console.log("link match snippet %s", item.snippet);

            let fansLikes = item.snippet.split(" ");
            //console.log(fansLikes);
            for (let j = 0; j < fansLikes.length; j++) {
                if (fansLikes[j] == "Fans." || fansLikes[j] == "fans.") {
                    tiktokId = fansLikes[j - 1];
                    break;
                } else if (fansLikes[j].indexOf("Followers;") != -1 || fansLikes[j].indexOf("followers;") != -1) {
                    tiktokId = fansLikes[j].replace("Followers;", "").replace("followers;", "");
                    break;
                }

            }

            //console.log("tiktok id: %s",tiktokId);
            if (tiktokId) {
                if (tiktokId.indexOf("K") != -1) {
                    tiktokId = tiktokId.replace("K", "");
                    tiktokId = tiktokId * 1000;
                } else if (tiktokId.indexOf("M") != -1) {
                    tiktokId = tiktokId.replace("M", "");
                    tiktokId = tiktokId * 1000000;
                    //console.log("millon %s", tiktokId);
                }
                break;
            }
        }
        //console.log("snippet %s",item.snippet);
    }

    return tiktokId | ' ';

}
