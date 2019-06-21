// purpose : AE(Automation Edge) Services this js file required for Authenticate and Execute AE workflow.

const Cryptr = require('cryptr');
const cryptr = new Cryptr('70 108 111 108 111 103 105 99 64 49 50 51');
var fs = require("fs");
const Request = require('request'); //Request module is required for request Post and Get method in node js.
var logger = require("./logger").Logger; //Logger file required for maintain error logs.


module.exports = {
            //purpose : This function is required for authenticate with Automation Edge Workflow.
            AuthenticateToAE:function (getsession,callback) {                
                try
                {
                    
                    const decryptedUserName = cryptr.decrypt(process.env.AEUserName);
                    const decryptedPassword = cryptr.decrypt(process.env.AEPassword);
                            
                    var temp = '';
                    //Set the headers
                    var headers = {
                        'Content-Type': 'application/json; charset=UTF-8' }

                    console.log("url",process.env.AEbaseUrl+'authenticate');
                    // Configure the request
                    var options = {
                        url: process.env.AEbaseUrl+'authenticate' ,
                        method: 'POST',
                        headers: headers,
                        form: { 'username': decryptedUserName, 'password': decryptedPassword }
                        }//end option

                    // Start the request
                        Request(options, function (error, response, body) {
                        if (!error && response.statusCode == 200) {    

                           var temp = JSON.parse(body);  
                           logger.info("Autheticate With AE sucessful return session token is::"+temp.sessionToken,getsession.conversationData.userName);
                           return callback(temp.sessionToken);
                        }
                        else{
                            //console.log();
                        getsession.send("Unexpected error occured please contact your Administrator");
                        logger.error("Fail authentication with AE error code:" + response.statusCode,getsession.conversationData.userName);
                        getsession.endDialog();
                        }
                    });
                }
                catch(e)
                {
                    getsession.send("Unexpected error occured please contact your Administrator Exception");
                    logger.error("Exception Thrown by Authentication with AE:",getsession.conversationData.userName);
                    getsession.endDialog();
                }
            },            
            //purpose : This function is required for Execute AE workflow for create ticket with Automation Edge Workflow.
            ExecuteMethodForCreateTicket:function (getsession,callback) {
                this.AuthenticateToAE(getsession,function (authtokenfromae) {                                                           
                    var requestid = '';                           

                        var requestData =
                        {
                            "orgCode": "INFOR_UAT",
                            "workflowName": "Create Ticket",
                            "sourceId": null,
                            "params": [
                                {
                                "name": "channelType",
                                "value": "S4B"
                                },
                                {
                                "name": "botId",
                                "value": getsession.conversationData.botID
                                },
                                {
                                "name": "botName",
                                "value": getsession.conversationData.botName
                                },
                                {
                                "name": "userId",
                                "value": getsession.conversationData.userID
                                },
                                {
                                "name": "userName",
                                "value": getsession.conversationData.userName
                                },                                
                                {
                                "name": "conversationId",
                                "value":getsession.conversationData.conversationID
                                },
                                {
                                "name": "serviceUrl",
                                "value": getsession.conversationData.serviceurl+"/v3/conversations/"+ getsession.conversationData.conversationID+"/activities"
                                },
                                {
                                "name": "shortDesc",
                                "value": getsession.conversationData.shortdescription
                                },
                                {
                                "name": "desc",
                                "value": getsession.conversationData.longdescription
                                }
                                ]          
                        }
                   
                        var actualdata= JSON.stringify(requestData);
                        
                        logger.info("Send request data to AE For Execute Workflow for create ticket:"+actualdata,getsession.conversationData.userName);
                        console.log("Send request data to AE For Execute Workflow:",requestData);                      
                        // Set the headers
                        var headers = {
                            'X-session-token': authtokenfromae,
                            'Content-Type': 'application/json; charset=UTF-8'
                        }
                    
                        // Configure the request
                        var options = {
                            url: process.env.AEbaseUrl+'execute',
                            method: 'POST',
                            headers: headers,
                            json: requestData
                        }         
                    
                        try{
                        // Start the request
                        Request(options, function (error, response, body) {
                            if (!error && response.statusCode == 200) {                                                                
                                requestid = body.automationRequestId;
                                logger.info("Request ID From AE for create ticket :"+requestid,getsession.conversationData.userName)    
                                return callback(requestid);       
                            }
                            else
                            {
                                getsession.send("Unexpected error occured,Please contact your Administrator");
                                logger.error("Workflow execution of AE fail with error code:"+response.statusCode,getsession.conversationData.userName);
                                getsession.endDialog();
                            }                
                        });
                        }
                        catch(e)
                        {
                            getsession.send("Unexpected error occured,Please contact your Administrator");
                            logger.error("Exception occur when executing AE workflow",getsession.conversationData.userName);
                            getsession.endDialog();
                        }

                        });
            },
            //purpose : This function is required for Execute with Automation Edge Workflow. 
            ExecuteMethodForGetTicketByID:function (getsession,callback) { 
                this.AuthenticateToAE(getsession,function (authtokenfromae) { 
                            
                    var requestid = '';
                        var requestData =
                        {
                            "orgCode": "INFOR_UAT",
                            "workflowName": "Get Ticket Details",
                            "sourceId": null,
                            "params": [
                                {
                                "name": "channelType",
                                "value": "S4B"
                                },
                                {
                                "name": "botId",
                                "value": getsession.conversationData.botID
                                },
                                {
                                "name": "botName",
                                "value": getsession.conversationData.botName
                                },
                                {
                                "name": "userId",
                                "value": getsession.conversationData.userID
                                },
                                {
                                "name": "userName",
                                "value": getsession.conversationData.userName
                                },                                
                                {
                                "name": "conversationId",
                                "value":getsession.conversationData.conversationID
                                },
                                {
                                "name": "serviceUrl",
                                "value": getsession.conversationData.serviceurl+"/v3/conversations/"+ getsession.conversationData.conversationID+"/activities"
                                },
                                {  
                                "name":"ticketId",
                                "value": getsession.conversationData.TicketID
                                }
                              
                                ]          
                        } 
                         var actualdata= JSON.stringify(requestData);
                        logger.info("Send request data to AE For Execute Workflow for Get perticular ticket:"+ actualdata,getsession.conversationData.userName);
                        // Set the headers
                        var headers = {
                            'X-session-token': authtokenfromae,
                            'Content-Type': 'application/json; charset=UTF-8'
                        }                    
                        // Configure the request
                        var options = {
                            url: process.env.AEbaseUrl+'execute',
                            method: 'POST',
                            headers: headers,
                            json: requestData
                        }                        
                        console.log("Request data ",requestData);
                    
                        try{
                        // Start the request
                            Request(options, function (error, response, body) {
                                if (!error && response.statusCode == 200) {                                                                
                                    requestid = body.automationRequestId;
                                    logger.info("Request ID From AE for get data for particular ticket :"+requestid,getsession.conversationData.userName)  
                                    return callback(requestid);       
                                }
                                else
                                {
                                    getsession.send("Unexpected error occured,Please contact your Administrator");
                                    logger.error("Workflow execution of AE fail with error code:"+response.statusCode,getsession.conversationData.userName);
                                    getsession.endDialog();
                                }                
                            });
                        }
                        catch(e)
                        {
                            getsession.send("Unexpected error occured,Please contact your Administrator");
                            logger.error("Exception occur when executing AE workflow",getsession.conversationData.userName);
                            getsession.endDialog();
                        }

                        });
            },
            //purpose : This function is required for Execute method for all open ticket with Automation Edge Workflow. 
            ExecuteMethodForGetOpenTicketDetails:function (getsession,callback) { 
                this.AuthenticateToAE(getsession,function (authtokenfromae) { 
                            
                    var requestid = '';
                        var requestData =
                        {
                            "orgCode":"INFOR_UAT",
                            "workflowName":"List Tickets",
                            "sourceId":null,
                            "params": [
                                {
                                "name": "channelType",
                                "value": "S4B"
                                },
                                {
                                "name": "botId",
                                "value": getsession.conversationData.botID
                                },
                                {
                                "name": "botName",
                                "value": getsession.conversationData.botName
                                },
                                {
                                "name": "userId",
                                "value": getsession.conversationData.userID
                                },
                                {
                                "name": "userName",
                                "value": getsession.conversationData.userName
                                },                                
                                {
                                "name": "conversationId",
                                "value":getsession.conversationData.conversationID
                                },
                                {
                                "name": "serviceUrl",
                                "value": getsession.conversationData.serviceurl+"/v3/conversations/"+ getsession.conversationData.conversationID+"/activities"
                                }
                                ]          
                        }
                         
                        var actualdata= JSON.stringify(requestData);
                        logger.info("Send request data to AE For Execute Workflow for Get perticular ticket:"+ actualdata,getsession.conversationData.userName);                     
                        // Set the headers
                        var headers = {
                            'X-session-token': authtokenfromae,
                            'Content-Type': 'application/json; charset=UTF-8'
                        }
                    
                        // Configure the request
                        var options = {
                            url: process.env.AEbaseUrl+'execute',
                            method: 'POST',
                            headers: headers,
                            json: requestData
                        }
                        
                        console.log("Request data",requestData);
                    
                        try{
                        // Start the request
                        Request(options, function (error, response, body) {
                            if (!error && response.statusCode == 200) {                                                                
                                requestid = body.automationRequestId;
                                logger.info("Request ID From AE for get data for particular ticket :"+requestid,getsession.conversationData.userName)  
                                return callback(requestid);       
                            }
                            else
                            {
                                getsession.send("Unexpected error occured,Please contact your Administrator");
                                logger.error("Workflow execution of AE fail with error code:"+response.statusCode,getsession.conversationData.userName);
                                getsession.endDialog();
                            }                
                        });
                        }
                        catch(e)
                        {
                            getsession.send("Unexpected error occured,Please contact your Administrator");
                            logger.error("Exception occur when executing AE workflow",getsession.conversationData.userName);
                            getsession.endDialog();
                        }

                        });
            }  
        }
