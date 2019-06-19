var fs = require("fs");
const Request = require('request');
var logger = require("./logger").Logger;
// next we'll want make our Logger object available
// to whatever file references it.
//var Service = (exports.Service = {});

module.exports = {                
            //Authentication with MS Bot
            AuthenticateWithMSBot:function(getsession,callback)
            {  
                   
                try{
                var requestData = "grant_type=client_credentials&client_id="+ process.env.MICROSOFT_APP_ID +"&client_secret="+process.env.MICROSOFT_APP_PASSWORD+"&scope=https%3A%2F%2Fapi.botframework.com%2F.default"
                
                // Set the headers
                var headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            
                // Configure the request
                var options = {
                    url: process.env.MSBotAuthTokenUrl,
                    method: 'POST',
                    headers: headers,
                    body: requestData
                }
            
                // Start the request
                Request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                                                       
                    var tokendata=JSON.parse(body);             
                     
                       return callback(tokendata.access_token);
                    }
                    else{                    
                        logger.info("Authentication fail with MS Bot Reg."+ response.statusCode,getsession.conversationData.userName);
                    }      
                })
              }
              catch(e)
              {
                logger.info("MS Bot Authentication exception:"+e);
              } 
            
            }
}