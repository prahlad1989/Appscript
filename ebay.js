  function onOpen() {
    var ui = SpreadsheetApp.getUi();
    // Or DocumentApp or FormApp.
    ui.createMenu('EBayRelated')
    .addItem('GetSellers', 'menuItem1Fuc')
    .addSeparator()
    .addSubMenu(ui.createMenu('Other')
                .addItem('Second item', 'menuItem2'))
    .addToUi();
    
  }
  
 
  
  function menuItem1Fuc() {
     startTimer=new Date().getTime();
    //tempFunction();
    //SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
    // .alert('You clicked the first menu item!');
    var inputSheet=SpreadsheetApp.getActive().getSheetByName("Input");
    sheetInput=getFromSheet();
    //Do some validations for input
    
    let inputs={};
    inputs.sellerId=sheetInput[0];
    inputs.noOfMonths=sheetInput[1];
    
    
    let itmes=getAllItems(inputs)
    previouscount=items.length;
    items=getGood(items);
    console.log("print to excel at sec: "+(new Date().getTime()-startTimer)/1000);
    updateToGSheet(items,inputs.sellerId,inputs.noOfMonths);
    console.log("print to excel end at sec: "+(new Date().getTime()-startTimer)/1000);

    }
  
  
  
  function getAllItems(inputs){    
    
    var headers=  {
      'X-EBAY-SOA-SECURITY-APPNAME':'SatyaPra-MyEBPrac-PRD-abce464fb-dd2ae5fe',
      'X-EBAY-SOA-OPERATION-NAME':'findItemsAdvanced',
      'muteHttpExceptions':true,
      'X-EBAY-SOA-SERVICE-NAME': 'FindingService',
     // 'Content-type':'text/xml;charset=utf-8'
      'contentType': 'text/xml'
      
    };
    today=new Date(); 
    querySpan=noOfMonths*30 //days
    itemMap=new Map();
    
    startDateTo = today;
    fromDate=today.getTime()-querySpan*86400*1000
    
    startDateFrom = new Date(fromDate);
    console.log("from date: "+startDateFrom.toISOString());
    //queryRepeatitions=(inputs.noOfMonths*30)/querySpan;
    queryRepeatitions=1;
    payLoadToFindPages=[];
    
    //sellerIdFromSheet, noOfMonths = getFromSheet();
    //console.log("seller id fro sheet  {sellerIdFromSheet}")
    //console.log("no of months {str(noOfMonths)}")
    pageNumber=1;    
    findUrl="https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SECURITY-APPNAME=SatyaPra-MyEBPrac-PRD-abce464fb-dd2ae5fe";
    payloadTemplate="<?xml version=\"1.0\" encoding=\"UTF-8\"?><findItemsAdvancedRequest xmlns=\"http://www.ebay.com/marketplace/search/v1/services\"> dateInput <ErrorLanguage >en_US</ErrorLanguage>  <WarningLevel >High</WarningLevel>  <GranularityLevel >Coarse</GranularityLevel>  <IncludeWatchCount>true</IncludeWatchCount>  <OutputSelector >Title</OutputSelector>  <OutputSelector >SellingStatus</OutputSelector>  <OutputSelector >ListingDuration</OutputSelector>  <OutputSelector >ItemsPerPage</OutputSelector>  <OutputSelector >PrimaryCategory</OutputSelector>  <OutputSelector >PageNumber</OutputSelector>  <OutputSelector >ReturnedItemCountActual</OutputSelector>  <OutputSelector >HasMoreItems</OutputSelector>  <OutputSelector >PaginationResult</OutputSelector>  <OutputSelector >StartTime</OutputSelector>  <OutputSelector >EndTime</OutputSelector>   <paginationInput >    <entriesPerPage>100</entriesPerPage>    pageInput  </paginationInput>  <itemFilter>    <name>Seller</name>   <value>sellerId</value>  </itemFilter></findItemsAdvancedRequest>";
    payload=payloadTemplate.replace("sellerId",inputs.sellerId);
    
    items=[]
    map=new Map();
    
      let options = {
      'method' : 'post',
          'X-EBAY-SOA-SECURITY-APPNAME':'SatyaPra-MyEBPrac-PRD-abce464fb-dd2ae5fe',
      'X-EBAY-SOA-OPERATION-NAME':'findItemsAdvanced',
      'muteHttpExceptions':true,
      'X-EBAY-SOA-SERVICE-NAME': 'FindingService',  
      
      };
    
    
    for(let i=0;i<1;i++){
    payloadAfterDateSet=payload.replace('dateInput','<StartTimeTo>'+startDateTo.toISOString()+'</StartTimeTo><StartTimeFrom>'+startDateFrom.toISOString()+'</StartTimeFrom>')
    
      
      //updateInputSheet("Retrieving items in the last "+((1+queryRepeatitions)*querySpan)+"   days");    
      console.log("loop"+i+'for todate: '+startDateTo.toISOString()+"  from date "+startDateFrom.toISOString()); 
      startDateTo=new Date(startDateTo.getTime()-querySpan*86400*1000);
      startDateFrom=new Date(startDateFrom.getTime()-querySpan*86400*1000);
      
    pageNumber=1;
    while(true){
    
      payloadAfterPagination=  payloadAfterDateSet.replace('pageInput','<pageNumber>'+pageNumber+'</pageNumber>');
      //payLoadToFindPages.push(payloadForEachQuery);
      options.payload = payloadAfterPagination;
      response=UrlFetchApp.fetch(findUrl, options);
      document=XmlService.parse(response.getContentText());
      
      root=document.getRootElement();
      var namespace=XmlService.getNamespace("http://www.ebay.com/marketplace/search/v1/services");
      ack=root.getChild("ack", namespace);
      //SpreadsheetApp.getUi().alert("bad"+root.getChild("searchResult",namespace));
      if (ack && !ack.getText()=='Success'){
        SpreadsheetApp.getUi().alert("failure");
        break;
      }
      else if(!root.getChild("searchResult",namespace)){
        SpreadsheetApp.getUi().alert("no searchresult");
        break;
      }
      else if(!root.getChild("searchResult",namespace) || !root.getChild("searchResult",namespace).getAttribute("count")>0  ){
       break;
     }else{
       let itemTags=root.getChild("searchResult",namespace).getChildren();
        itemTags.forEach(function(itemNode){
                         item=new Item(itemNode.getChild("title",namespace).getText(),
                                      itemNode.getChild("viewItemURL",namespace).getText(),
                                      itemNode.getChild("itemId",namespace).getText(),
                                      itemNode.getChild("sellingStatus",namespace).getChild("currentPrice",namespace).getText(),
                                      itemNode.getChild('listingInfo',namespace).getChild("watchCount",namespace) ? itemNode.getChild('listingInfo',namespace).getChild("watchCount",namespace).getText():0,
                                      itemNode.getChild("primaryCategory",namespace).getChild("categoryId",namespace).getText(),
                                      itemNode.getChild("primaryCategory",namespace).getChild("categoryName",namespace).getText(),
                                      itemNode.getChild("sellingStatus",namespace).getChild("timeLeft",namespace).getText());
                       //startTime = datetime.datetime.strptime(item['listingInfo']['startTime'], "%Y-%m-%dT%H:%M:%S.%fZ")
                              startTime=new Date(itemNode.getChild('listingInfo',namespace).getChild("startTime",namespace).getText()).getTime();
                              endTime = new Date(itemNode.getChild('listingInfo',namespace).getChild("endTime",namespace).getText()).getTime();
                              //SpreadsheetApp.getUi().alert(startTime+"  "+endTime);
                              diff=Math.ceil(Math.abs((today.getTime()-startTime)/(86400*1000)));
                              item.startTime=startTime;
                              item.DurationCalc=diff;
                              //console.log(item.title+" and "+startTime/(86400*1000)+" and "+new Date(itemNode.getChild('listingInfo',namespace).getChild("startTime",namespace).getText()));
                              //SpreadsheetApp.getUi().alert(item.DurationCalc);
                              if (!map.has(item.itemId) || (map.has(item.itemId) && map.get(item.itemId).startTime < item.startTime )){
                                map.set(item.itemId,item);
                              }
                                
                              //map.set(item.itemId,item);
                              //return item;
         
                        }); 
       remainingPages = root.getChild('paginationOutput', namespace).getChild('totalPages',namespace).getText() - 
                      root.getChild('paginationOutput', namespace).getChild('pageNumber',namespace).getText();
       //console.log("fetched "+items.length+" items");
       timeTaken=new Date().getTime()-startTimer;
       remainingTime=340*1000-timeTaken;
       
       
       
       //console.log("Time taken so far in millsec: "+timeTaken+" in sec"+(timeTaken/1000));
       
       if (remainingPages == 0 || (((map.size)/10)*1000 > remainingTime) ){
          break;
       }
//          break;
//       }
//       if (remainingPages == 0 || pageNumber  == 25){
//          break;
//       }
       // query allows only upto max 100 pages
       pageNumber++;       
     }

    }
      
    }
      console.log("map size: "+map.size);
      timeTaken=new Date().getTime()-startTimer;
      console.log("Time taken so far in millsec: "+timeTaken+" in sec"+(timeTaken/1000));
      for (let value of map.values()) {
        items.push(value);
      }
      
      return items;
    
    
  }
   
  
  
  
  
  
  
  
  
  function getGood(items){
    tic=new Date().getTime();
    var headers=  {
      'X-EBAY-API-APP-ID':'SatyaPra-MyEBPrac-PRD-abce464fb-dd2ae5fe',
      'X-EBAY-API-SITE-ID':'0',
      'X-EBAY-API-CALL-NAME':'GetMultipleItems',
      'X-EBAY-API-VERSION':'863',
      'X-EBAY-API-REQUEST-ENCODING':'xml',
      'Content-type':'text/xml;charset=utf-8'
    };
       
    //multiItemPayLoad="<?xml version=\'1.0\' encoding=\'utf-8\'?><GetMultipleItemsRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\"><ItemID>392788288994</ItemID><ItemID>392776787067</ItemID><ItemID>392762878869</ItemID><ItemID>392773561372</ItemID><ItemID>392750648407</ItemID><ItemID>392720033556</ItemID><ItemID>392779072100</ItemID><ItemID>392774464111</ItemID><ItemID>392782806672</ItemID><ItemID>392771489096</ItemID><ItemID>392781925778</ItemID><ItemID>392777712582</ItemID><ItemID>392762267877</ItemID><ItemID>392782831905</ItemID><ItemID>392762081700</ItemID><ItemID>392756081896</ItemID><ItemID>392747215525</ItemID><ItemID>392773614242</ItemID><ItemID>392781926753</ItemID><ItemID>392762271632</ItemID></GetMultipleItemsRequest>";
    multiItemPayLoadTemplate="<?xml version=\'1.0\' encoding=\'utf-8\'?><GetMultipleItemsRequest xmlns=\"urn:ebay:apis:eBLBaseComponents\">itemIds<IncludeSelector>Details</IncludeSelector></GetMultipleItemsRequest>";
    options={
      'headers':headers,
      'payload':"",
      'method':'post'
    }
    
   // SpreadsheetApp.getUi().alert("shopping");
    let itemIdSet = new Set(items.map(function(item){
    return item.itemId;
    }));
    
    
    inputObjects = []
    
    tic=new Date().getTime();
    j = 0
    _ = 0

    while (_ < (items.length)){
        console.log(_+ "out of "+items.length)
        if( _ + 20 >= items.length)
            j = items.length;
        else
            j = _ + 20;
        
      //itemIdString="";
   
     let count=0;
    itemIdString = items.slice(_,j).reduce(function(itemIdString,item){
      count++;
      return itemIdString+"<ItemID>"+item.itemId+"</ItemID>";
      
    });
      itemIdString="";
      items.slice(_,j).forEach(function(item){
      itemIdString+="<ItemID>"+item.itemId+"</ItemID>";
      });

       //console.log("slice size "+items.slice(_,j).length+"  "+count);
        multiItemPayLoad=multiItemPayLoadTemplate.replace("itemIds",itemIdString);
      //console.log("itemidstring "+itemIdString);
        
        //SpreadsheetApp.getUi().alert(multiItemPayLoad);
        options.payload=multiItemPayLoad;
        
        //console.log("payload before"+multiItemPayLoad);
    try{
            
      let response=UrlFetchApp.fetch( "https://open.api.ebay.com/shopping",options);
      let document=XmlService.parse(response.getContentText());
      //console.log("response is"+response.getContentText());
     // sheet.getRange(7,5).activate().setValue(response.getContentText().substr(0,20000));
      //eturn;
      let root=document.getRootElement();
      var namespace=XmlService.getNamespace("urn:ebay:apis:eBLBaseComponents");
      
      ack=root.getChild("Ack", namespace);
      //SpreadsheetApp.getUi().alert("bad"+root.getChild("searchResult",namespace));
      if (ack && !ack.getText()=='Success'){
        SpreadsheetApp.getUi().alert("failure");
        break;
      }
      else if(root.getChildren("Item", namespace))

      {
        //console.log("Retrieving Sold and View for "+_+" items out of "+items.length);
        //updateInputSheet("Retrieving Sold and View for "+_+" items out of "+items.length);
        
        root.getChildren("Item", namespace).forEach(function(eachItemInResult,index){
        
                    //console.log(eachItemInResult.getText());
                    //SpreadsheetApp.getUi().alert(eachItemInResult.getChild('QuantitySold',namespace).getText());
                    //sheet.getRange(7+index,5).activate().setValue(eachItemInResult.getText().substr(0,20000));
        //console.log("quantity:"+eachItemInResult.getChild('QuantitySold',namespace).getText()+" hitcount:"+eachItemInResult.getChild('HitCount',namespace).getText()+' at _'+_);
                    
                   // SpreadsheetApp.getUi().alert(items[_+j]);

          if(eachItemInResult.getChild('ItemID',namespace) && items[_+index].itemId == eachItemInResult.getChild('ItemID',namespace).getText()){
             //console.log(eachItemInResult.getChild('ItemID',namespace).getText()+" and  "+eachItemInResult.getChild("Title",namespace).getText()+"and"+new Date(eachItemInResult.getChild('StartTime',namespace).getText()));
             if(items[_+index] && eachItemInResult.getChild('QuantitySold',namespace)){ 
                      items[_ + index].QuantitySold = eachItemInResult.getChild('QuantitySold',namespace).getText();
                    }
                    if(items[_+index] && eachItemInResult.getChild('HitCount',namespace)){ 
                      items[_ + index].HitCount =  eachItemInResult.getChild('HitCount',namespace).getText();
                      //console.log("item.title"+items[_+index].title+" sold"+ items[_ + index].QuantitySold+"  and hit count"+items[_ + index].HitCount);
                    }
                    if(items[_+index] && eachItemInResult.getChild('SKU',namespace)){ 
                      items[_ + index].SKU =  eachItemInResult.getChild('SKU',namespace).getText();
                      console.log("sku %s",items[_ + index].SKU);
                      //console.log("item.title"+items[_+index].title+" sold"+ items[_ + index].QuantitySold+"  and hit count"+items[_ + index].HitCount);
                    }
          }
          

      });
        
      }
      
      
    }catch(err){
      SpreadsheetApp.getUi().alert("err is : "+err.message);
      throw err;
    }
        _ = j
         
      toc=new Date().getTime();
      if(toc-startTimer > 349*1000){
         break;
      }
  } 
    return items;
  }
  
  function menuItem2() {
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
    .alert('You clicked the second menu item!');
  }
  
  function showMessageBox() {
    Browser.msgBox('You clicked it!');
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
