
var currentSpreadSheet=SpreadsheetApp.getActive();

function myFunction() {
  SpreadsheetApp.getActive().getActiveSheet().getRange(1, 1, 1, 1).setValue("great aswos");
  return "date sssis "+new Date();
}

function toOthers(){
  
  var otherSpreadSheetId="1gmsnJJy9mFOZgMkVmqD8ic853PapVtmSvW-Mf_Z-SyU";
  var otherSpreadSheet=SpreadsheetApp.openById(otherSpreadSheetId);
  //deleting existing tab sheet in other spreadsheet
  otherSpreadSheet.getSheets().forEach(function(sheet){
    sheet.getName() != 'DontDelete' && otherSpreadSheet.deleteSheet(sheet);
  });
  
  SpreadsheetApp.getActive().getSheets().forEach(function(sheet){
    if (sheet.getName() != 'NewModel') {
            sheet.copyTo(otherSpreadSheet);
        }
  });
//SpreadsheetApp.getUi().alert(otherSpreadSheet.getSheets());
  otherSpreadSheet.getSheets().forEach(function(sheet){
    if(sheet && sheet.getName() != 'DontDelete' ){
       correctedName=sheet.getName().replace("Copy of ","");
        if(sheet.getLastColumn()>4) 
          sheet.deleteColumns(5,sheet.getLastColumn()-4)
        sheet.deleteColumn(3);
        sheet.setName(correctedName);
    }
   
  });
  
}

function fromOther(){
  var otherSpreadSheetId="1gmsnJJy9mFOZgMkVmqD8ic853PapVtmSvW-Mf_Z-SyU";
var otherSpreadSheet=SpreadsheetApp.openById(otherSpreadSheetId);
  otherSpreadSheet.getSheets().forEach(function(other){
    if(other.getName() != 'DontDelete'){
      currentTab = currentSpreadSheet.getSheetByName(other.getName());
      if(currentTab){
        //SpreadsheetApp.getUi().alert("got sheet");
        values=other.getRange(1,3,other.getLastRow(),1).getValues();
        //SpreadsheetApp.getUi().alert(other.getName()+"  "+values);
        currentTab.getRange(1, 4, other.getLastRow(), 1).setValues(values)
      }
      
    }
  })
}

function onOpen() {
    var ui = SpreadsheetApp.getUi();
    // Or DocumentApp or FormApp.
    ui.createMenu('HorseRace')
    .addItem('ColorCurrent', 'colorSelected')
    .addSeparator()
    .addItem('ColorAll', 'colorAll')
    .addSeparator()
    .addItem('Copy To Other','toOthers')
    .addSeparator()
    .addItem('Copy From Other','fromOther')
    .addToUi();

}

function colorAll() {
    SpreadsheetApp.getActive().getSheets().forEach(function (sheet) {
        if (sheet.getName() != 'NewModel') {
            myfun(sheet);
        }
    });
    //console.log("completed at end");
    return new Date().toString();
    //colorSelected();
}

function colorSelected() {
    //SpreadsheetApp.getUi().alert("gdreat");
    myfun(SpreadsheetApp.getActive().getActiveSheet());
}

function colorSpecifiedSheet(sheetName) {
    myfun(SpreadsheetApp.getActive().getSheetByName(sheetName));
    return "executed script";
}

function returnTime1() {
    return new Date().toString();
}

function myfun(currentSheet) {
    ////console.log("great");

    currentSheet.getName();
    let lastRow = currentSheet.getLastRow();
    let startRow = 5;

    let range = currentSheet.getRange(5, 1, 30, 11);

    let values = range.getValues().filter(function (x, i) {
        return x[0] != '';
    });

    if (!values.length)
        return;

    for (i = 0; i < values.length; i++) {
        x = values[i];
       if (x[0] && typeof(x[3]) != 'number' )
            return;
    }

    let range2 = currentSheet.getRange(5, 11, values.length, 1);

    let descending = function (x, y) {
        return y - x;
    };
    let ascending = function (x, y) {
        return x - y;
    }
    let isRedRow = function (i) {
        return (values[i][2] >= 41 || values[i][4] >= 30 || values[i][2] <= 0 || values[i][3] <= 0)
    }

    let getAllIndexes = function (arr, val) {
        var indexes = [],
        i = -1;
        while ((i = arr.indexOf(val, i + 1)) != -1) {
            indexes.push(i);
        }
        indexes = indexes.filter(function (i) {
            return !isRedRow(i);
        })
            return indexes;
    }

    //SpreadsheetApp.getUi().alert(values);
    let colors = range.getValues().map(function (x, i) {
        return x.map(function (y, j) {
            return "white";
        });
    });
    ////console.log("colors %s", colors);
    values.forEach(function (x, i) { //filtering for red;
        if (isRedRow(i)) {
            colors[i][5] = "#a61c00";
            colors[i][6] = "#a61c00";
            colors[i][8] = "#a61c00";
            colors[i][9] = "#a61c00";
        }

    });
    //Now get the column values that except red related.

    ////console.log("values %s", values);

    //filtering for red color.
    let processGreen = function (sortFunction, columnNum, color) {
        let greenColumn = values.map(function (x) {
            return x[columnNum];
        });

        let map = new Map();
        greenColumn.forEach(function (x, i) {
            if (map.has(x))
                map.set(x, map.get(x) + 1);
            else
                map.set(x, 1);
        });
        ////console.log("forgreen %s", greenColumn);
        let forGreen = greenColumn.filter(function (x, i) {
            return !isRedRow(i) && x >= 5;
        });
        ////console.log("aftergreen %s", forGreen);
        forGreen = Array.from(new Set(forGreen)).sort(sortFunction);
        let rowsWithPositiveOdds = 0;
        values.forEach(function (x) {
            if (x[2] > 0)
                rowsWithPositiveOdds++;
        });
        ////console.log("rowsWithPositiveOdds %s",rowsWithPositiveOdds);
        let limitForGreenColor = rowsWithPositiveOdds > 11 ? Math.min(4, forGreen.length) : Math.min(3, forGreen.length);
        ////console.log("limit color %s", limitForGreenColor);
        forGreen = forGreen.slice(0, limitForGreenColor);

        ////console.log("forgreen array %s", forGreen);
        let greenColoredIndices = [];

        for (let i = 0; i < forGreen.length; i++) {
            let x = forGreen[i];

            if (limitForGreenColor > greenColoredIndices.length) {
                if (map.has(x)) {
                    let occurances = getAllIndexes(greenColumn, x);
                    greenColoredIndices = greenColoredIndices.concat(occurances);
                    map.delete(x);
                }
            }

        }
        greenColoredIndices.sort(sortFunction);

        //console.log("greenset indices %s", greenColoredIndices);
        //Now apply green color to the elements.
        greenColoredIndices.forEach(function (x) { //filtering for green;
            colors[x][columnNum] = color;
        });
        greenColoredIndices = greenColoredIndices.filter(function (x, i) { //to consider only non zero valued rows
            return values[x][6] > 0;
        });
        //console.log("greenset indices %s", greenColoredIndices);
        return greenColoredIndices;
    }

    let greenColoredIndices = processGreen(ascending, 5, "#6aa84f");

    let yellowColumn = values.map(function (x) {
        return x[6]
    });

    //let forYellow = yellowColumn.filter(function (x, i) {
    // return greenColoredIndices.indexOf(i) != -1;
    //}).sort(ascending);
    let forYellow = greenColoredIndices.map(function (x) {
        return yellowColumn[x];
    }).sort(ascending);
    //console.log("for yellow elements to consider %s", forYellow);

    //let forYellowIndices=[];
    if (forYellow.length > 0) {
        forYellow = [forYellow[0], forYellow[forYellow.length - 1]];
    }
    //console.log("final for yelow %s", forYellow);
    //Now apply grren and yellow colors in yellow column in parallel to respective green column. (lowest to green, highest to yellow)
    greenColoredIndices.forEach(function (x, i) {
        if (forYellow[1] == yellowColumn[x]) { //hisgest to yellow
            colors[x][6] = "yellow";
        }
    });

    greenColoredIndices.forEach(function (x, i) {
        if (forYellow[0] == yellowColumn[x]) {
            colors[x][6] = "#6aa84f";
        }
    });

    //Second term
    greenColoredIndices = processGreen(descending, 8, "yellow");

    //make sure that you empty the last column values before updating.
    values = values.map(function (x, i) {
        x[10] = '';
        return x;
    });

    //Now for j column
    yellowColumn = values.map(function (x) {
        return x[9]
    });

    //discort below 30
    forYellowIndices = greenColoredIndices.filter(function (x, i) {
        return yellowColumn[x] < 30 && yellowColumn[x] != 0;
    });
    //for 20 or below into green;
    let forYellow20BelowIndices = forYellowIndices.filter(function (x, i) {
        return yellowColumn[x] <= 20
    });
    ////console.log("forYellow20BelowIndices %s",forYellow20BelowIndices);
    let below20Sorted = Array.from(new Set(forYellow20BelowIndices.map(function (x) {
                    return yellowColumn[x];
                }))).sort(ascending);

    ////console.log("for yellow elements to consider %s", below20Sorted);

    //let forYellowIndices=[];
    if (below20Sorted.length > 0) {
        below20Sorted = [below20Sorted[0], below20Sorted[below20Sorted.length - 1]];
    }
    ////console.log("below20Sorted %s",below20Sorted);
    ////console.log("final for yelow %s", forYellowIndices);
    //Now apply grren and yellow colors in yellow column in parallel to respective green column. (lowest to green, highest to yellow)
    //break going
    forYellow20BelowIndicesColored=[];
    forYellow20BelowIndices.forEach(function (x) {
        if (below20Sorted[1] == yellowColumn[x]) { //hisgest to yellow
            colors[x][9] = "yellow";
            forYellow20BelowIndicesColored.push(x);
        }
    });

    forYellow20BelowIndices.forEach(function (x) { //lowest to green
        if (below20Sorted[0] == yellowColumn[x]) {
            colors[x][9] = "#6aa84f";
            forYellow20BelowIndicesColored.push(x);
        }
    });

    //for 26 or aobove into maroon;
    let forMaroon26AboveIndices = forYellowIndices.filter(function (x, i) {
        return yellowColumn[x] < 30 && yellowColumn[x] > 20
    });
    ////console.log("forMaroon26AboveIndices %s",forMaroon26AboveIndices);
    let above26Sorted = Array.from(new Set(forMaroon26AboveIndices.map(function (x) {
                    return yellowColumn[x];
                }))).sort(ascending);

    ////console.log("for yellow elements to consider %s", above26Sorted);

    //let forYellowIndices=[];
    if (above26Sorted.length > 0) {
        above26Sorted = [above26Sorted[0], above26Sorted[above26Sorted.length - 1]];
    }
    ////console.log("above26Sorted %s",above26Sorted);
    ////console.log("final for yelow %s", forYellowIndices);
    //Now apply grren and yellow colors in yellow column in parallel to respective green column. (lowest to green, highest to yellow)
    //break going

    forMaroon26AboveIndices.forEach(function (x) {
        if (above26Sorted[1] == yellowColumn[x]) { //hisgest to yellow
            colors[x][9] = "#4a86e8";
            values[x][10] = values[x][0];
            ////console.log("values[x][10] %s",values[x][10]);
            colors[x][10] = "#4a86e8";
        }
    });

    forYellowIndices = forYellowIndices.filter(function (x, i) {
        return values[x][9] != above26Sorted[1];
    });
    //console.log("forYellowIndices before %s", forYellowIndices);

    let dColumnHighest = forYellow20BelowIndicesColored.map(function (x, i) {
        return values[x][3]
    }).sort(descending)[0];
    console.log("dColumnHighest %s", dColumnHighest);
    console.log("forYellowIndices %s",forYellowIndices);
    forYellow20BelowIndicesColored.forEach(function (x, i) {
        if (values[x][3] == dColumnHighest && (values[x][9] == below20Sorted[0] || values[x][9] == below20Sorted[1])) {
            values[x][10] = values[x][0];
            //console.log("valuesx [x][10] %s in %s in yellow", x, values[x][10]);
            colors[x][10] = "yellow";
        }
    });

    

    let values2 = values.map(function (x, i) {
        return x.slice(10, 11);
    });
    //console.log("values2 %s",values2);
    
        ////console.log(colors);
        //////console.log("values lastly %s",values);
        let colors2 = colors.map(function (x, i) {
        return x.slice(10, 11);
    }).filter(function (x, i) {
        return i < values.length;
    });
    //console.log("colors last %s",colors2);
    range.setFontColors(colors);
    range2 && range2.setValues(values2).setFontColors(colors2);

}