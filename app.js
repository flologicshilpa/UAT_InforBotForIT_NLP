//purpose : This is the main file it containts code to handle Create Ticket,Get Ticket Use Cases and bot builder connection.
const utf8 = require('utf8');
const Request = require('request');
var getsession='';
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();
  // Here we import our Logger file and instantiate a logger object
  var logger = require("./Services/logger").Logger;
  var aeservice = require("./Services/aeService");
  var msbotservice=require("./Services/msBotService");
  var messageFormating = require("./MessageFormat/MessageFormating").MessageFormat;


var express = require('express')
  , http = process.env.HTTPS == 'on' ? require('https') : require('http')
  , builder = require('botbuilder');

var app = express()
  , server = http.createServer(app)
  , port = process.env.port || process.env.PORT || 3000
  , config = { appId: process.env.MICROSOFT_APP_ID, appPassword: process.env.MICROSOFT_APP_PASSWORD }
  , connector = new builder.ChatConnector(config)
  , bot = new builder.UniversalBot(connector, [
        function (session) {
            
          //  session.beginDialog('QnAMaker');
        }
    ]).set('storage', inMemoryStorage);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());

  bot.use({
    botbuilder: function (session, next) {
        session.send(); // it doesn't work without this..
        session.sendTyping();
        next();
    }
});

//memory 
  var inMemoryStorage = new builder.MemoryBotStorage(); 

 // respond to bot messages
 app.post('/api/messages', connector.listen());

 // start the server
 server.listen(port, function() {
   console.log('Listening on %s', port);
 });

const logUserConversation = (event) => {  
    var text1=event.text;
    var text2=text1.replace("&#160;"," ");
     event.text=text2.replace(/&#160;/g, '');   
};

// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});
//Luis Connection
var luisAppId = process.env.LuisAppId;  //'092af96a-08ad-4425-a064-3574ce228a73' ; 
var luisAPIKey = process.env.LuisAPIKey; 
var luisAPIHostName = process.env.LuisAPIHostName; 
const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
var recognizer = new builder.LuisRecognizer(LuisModelUrl).onEnabled(function (context, callback) {
    var enabled = context.dialogStack().length == 0;
    callback(null, enabled);
});
bot.recognizer(recognizer);


//Greeting Dialog to greet the user
bot.dialog('Greeting',[
    function (session, args, next) {    
       
      //console.log(jsonParse.localTimestamp);
      if(process.env.Luis_Service_enabled=="no" && process.env.Qna_Service_enabled=="no")
      {
        session.send(process.env.System_down_Message);
        session.endDialog();
      }
      else
      {
          if(process.env.Luis_Service_enabled=="no")
          {
            session.send(process.env.Luis_ServiceDown_Message);            
          }
          else if(process.env.Qna_Service_enabled=="no")
          {
            session.send(process.env.QNA_ServiceDown_Message); 
          }
           messageFormating.WelcomeMessage(session)
           session.endDialog();
      }
    }
]).triggerAction({
    matches: 'Intent_Greeting'
});

//help dialog
bot.dialog('Help',[
    function (session, args, next) {                
        session.send("If you want to create ticket enter query like <b>Create ticket</b> ");
        session.endDialog();
        }
]).triggerAction({
    matches: 'Intent_Help'
});

//smalltalk
bot.dialog('SmallTalk',[
    function (session, args, next) {                
        session.send("It looks like I couldn't find an asnwer for your question. Maybe I need to learn more about this topic. You can also try rephrasing the question.");
        session.endDialog();
        }
]).triggerAction({
    matches: 'SmallTalk'
});

//default dailog
bot.dialog('None',[
    function (session, args, next) {    
      var jsonData = JSON.stringify(session.message);
      var jsonParse = JSON.parse(jsonData);
      session.conversationData.userName=jsonParse.address.user.name;
        session.send("It looks like I couldn't find an asnwer for your question. Maybe I need to learn more about this topic. You can also try rephrasing the question.",session.conversationData.userName);
       session.endDialog();
    }
]).triggerAction({
    matches: 'None'
});

//create ticket Dialog
bot.dialog('CreateTicketDialog',[
    function (session, args, next) { 
         if(process.env.Luis_Service_enabled=="no")
            {
                session.send(process.env.Luis_ServiceDown_Message);
                session.endDialog();
            }
            else
            {
            builder.Prompts.text(session, "Great! you want to report an issue. Let's get started.Enter a short title/description for your ticket.");              
            }
        },
        function (session, results) {
            session.conversationData.shortdescription =  results.response;
           builder.Prompts.text(session, 'Thanks! Now, in couple lines describe the topic so my team can better understand your issue');      
        },
        function (session, results) {
            session.conversationData.longdescription = results.response;
           builder.Prompts.confirm(session, "Thanks! I have everything I need to create a ticket. Should I go ahead and create the ticket? (Y/N)");        
    
            // session.send("Name:%s,Id:%s,ChannelId:%s,ChannelName:%s",name,id,channelid,channelname);
            // session.send(`Ticket is created sucessfully with ticket details: <br/>Number:  **TC123456** <br/>Created Date: **16-04-2019** <br/>Short Description: **${session.dialogData.shortdescription}** <br/>Long Description: **${session.dialogData.longdescription}**`);
            // session.endDialogWithResult(results);
        },
        function(session,results)
        {
           // console.log(results.response);
            if(results.response==true)
            {
                var jsonData = JSON.stringify(session.message);
                var jsonParse = JSON.parse(jsonData);
                session.conversationData.channelName=jsonParse.address.channelId;
                session.conversationData.botID=jsonParse.address.bot.id;
                session.conversationData.botName=jsonParse.address.bot.name;
                session.conversationData.userID=jsonParse.address.user.id;
                session.conversationData.userName=jsonParse.address.user.name;
                session.conversationData.conversationID=jsonParse.address.conversation.id;
                session.conversationData.channelid=jsonParse.address.id;
               
                session.conversationData.serviceurl=jsonParse.address.serviceUrl;
               session.conversationData.conjsonid=jsonParse.address.id;
             //  session.send('serviceurl:%s',JSON.stringify(jsonParse.address));
             // console.log("sessiondata!!!!!!!!!!!!",JSON.stringify(jsonParse.address));
                getsession =session;
                getTicketIDCreateTicket(session);
            }
          else{         
                 session.beginDialog('askQuestionAgain');
                 //session.send("No problem %s, I will not create a ticket this time.",session.conversationData.userName);
                 //session.endDialogWithResult(results.response);             
            }
        }         
]).triggerAction({
    matches: 'Intent_Create_Ticket'
});

//ask question again
//create ticket Dialog
bot.dialog('askQuestionAgain',[
    function (session, args, next) { 
        builder.Prompts.confirm(session, "No problem, I will not create a ticket at this time. Do you want to start over and try creating ticket again? (Y/N)");        
        },
        function(session,results)
        {            
            if(results.response==true)
            {
                session.beginDialog('CreateTicketDialog');
            }
            else{                
                session.send("Okay got it. I will end the process, although I will be right here if you think of any other ticket related request.");
                session.endDialog();
            }
        }         
]);
 
//Get ticket Dialog
bot.dialog('GetTicketDialog',[
    function (session, args, next) { 
        var gettiketentity,intent;
         if(process.env.Luis_Service_enabled=="no")
        {
            session.send(process.env.Luis_ServiceDown_Message);
            session.endDialog();
        }
        else
        {
          intent = args.intent;
          var entitylist= args.intent.entities;     
          gettiketentity = builder.EntityRecognizer.findEntity(intent.entities,'builtin.number');
              
        //session data 
                var jsonData = JSON.stringify(session.message);
                var jsonParse = JSON.parse(jsonData);
               
                session.conversationData.botID=jsonParse.address.bot.id;
                session.conversationData.botName=jsonParse.address.bot.name;
                session.conversationData.userID=jsonParse.address.user.id;
                session.conversationData.userName=jsonParse.address.user.name;
                session.conversationData.conversationID=jsonParse.address.conversation.id;
                session.conversationData.channelid=jsonParse.address.id;
                session.conversationData.channelName=jsonParse.address.channelId;
                session.conversationData.serviceurl=jsonParse.address.serviceUrl;
                session.conversationData.conjsonid=jsonParse.address.id; 
        //end session data

        if(gettiketentity)
        {
            var ticketnumber= gettiketentity.entity;          
            session.conversationData.TicketID=ticketnumber;          
            getTicketDetailsByID(session);            
        }
        else
        {        
            getOpenTicketDetails(session);
        }
     }//end service
  }//end function
           
]).triggerAction({
    matches: 'Intent_GetTickets'
});


//purpose : this function use for get executed method request id 
//and send message to user for create ticket   
function getTicketIDCreateTicket(session) {   
    aeservice.ExecuteMethodForCreateTicket(getsession,function (requestid) {         
          if(requestid)
          {
            getsession.send("Okay got it. Please wait for a moment while I complete your request...");           
              EndpointCreateTicketResponse(getsession,function(data)
              {
                 
                  if(data)
                  {
                      var sendmessage = messageFormating.TicketCreatedMessage(getsession,data.conversation_details.user_name,data.ticket.id);
                      msbotservice.AuthenticateWithMSBot(getsession,function (tokendata) {                     
                          var requestData = {
                              "type": "message",
                              "from": {
                                  "id": data.conversation_details.bot_id,
                                  "name": data.conversation_details.bot_name},
                              "conversation": {
                                  "id": data.conversation_details.conversation_id,
                                  "name": ""
                             },
                             "recipient": {
                                  "id": data.conversation_details.user_id,
                                  "name":data.conversation_details.user_name
                              },
                              "text": sendmessage ,
                              "replyToId": "3236fa10-4b88-11e9-9a61-233bf450fb8d"
                           }
                          
                          // Set the headers
                          var headers = {'Content-Type': 'application/json','Authorization':'Bearer '+tokendata} 

                          // Configure the request
                          var options = {
                              url: data.conversation_details.service_url,
                              method: 'POST',
                              headers: headers,
                              json: requestData
                          }
                      
                          // Start the request
                          Request(options, function (error, response, body) {
                              if (!error && response.statusCode == 200) {                                 
                                 logger.info("Chat channel Message send Sucessfully",getsession.conversationData.userName);
                                  session.endDialog();
                               
                              }
                              else{
                                  logger.info("Error occured when sending message to chat channel"+response.statusCode,getsession.conversationData.userName);
                                    session.endDialog();
                              }      
                          });//end
                      
                      });//end of Authenticate
                  }//return callback(ticketid);
              });//end of Createticket response
          
          }              

  });//end of execute method of AE WorkFlow
 session.endDialog();
}

//purpose : this function use for get executed method request id 
//and get details of perticular ticket and send it to user.  
function getTicketDetailsByID(session) {   
    aeservice.ExecuteMethodForGetTicketByID(session,function (requestid) { 
          if(requestid)
          {
            session.send("Okay got it. Please wait for a moment while I complete your request...");
            EndpointGetTicketByPerticularIDResponse(session,function(data)
            {
              var sendmessage='';                  
                  if(data.success=='false')
                  {             
                    testmessage=data.error_details;
                  }
                 else
                 {                   
                    sendmessage = messageFormating.DetailsofPerticularticketMsg(session,data);                                    
                 }
                msbotservice.AuthenticateWithMSBot(getsession,function (tokendata) {
                                    var requestData = {
                                        "type": "message",
                                        "from": {
                                            "id": data.conversation_details.bot_id,
                                            "name": data.conversation_details.bot_name},
                                        "conversation": {
                                            "id": data.conversation_details.conversation_id,
                                            "name": ""
                                       },
                                       "recipient": {
                                            "id": data.conversation_details.user_id,
                                            "name":data.conversation_details.user_name
                                        },
                                        "text": sendmessage,
                                        "replyToId": "3236fa10-4b88-11e9-9a61-233bf450fb8d"
                                     }
                                    
                                    // Set the headers
                                    var headers = {'Content-Type': 'application/json','Authorization':'Bearer '+tokendata} 
          
                                    // Configure the request
                                    var options = {
                                        url: data.conversation_details.service_url,
                                        method: 'POST',
                                        headers: headers,
                                        json: requestData
                                    }
                                
                                    // Start the request
                                    Request(options, function (error, response, body) {
                                        if (!error && response.statusCode == 200) {                                 
                                           logger.info("Chat channel Message send Sucessfully");
                                            session.endDialog();
                                         
                                        }
                                        else{
                                            logger.info("Error occured when sending message to chat channel"+response.statusCode,getsession.conversationData.userName);
                                            session.endDialog();
                                        }      
                                    });//end
                                
                                });//end of Authenticate

                  
                 
              });//end of Createticket response
          
          }              

  });//end of execute method of AE WorkFlow
  session.endDialog();
}

///purpose : this function use for get executed method request id 
//and get the list of all open ticket for authenticate user and send it to user.  

function getOpenTicketDetails(session) {   
    aeservice.ExecuteMethodForGetOpenTicketDetails(session,function (requestid) {          
          if(requestid)
          {
             session.send("Okay got it. Please wait for a moment while I complete your request...");
            EndpointGetTicketResponse(session,function(data)
            {
                 var sendmessage='';
                
                if(data.success=='false')
                {    
                    sendmessage=data.error_details;
                }
                else
                {
                    sendmessage=messageFormating.DetailsofAllopenTicketMsg(session,data);
                 
                }                    
               
                msbotservice.AuthenticateWithMSBot(session,function (tokendata) {
                var requestData = {
                                        "type": "message",
                                        "from": {
                                            "id": data.conversation_details.bot_id,
                                            "name": data.conversation_details.bot_name},
                                        "conversation": {
                                            "id": data.conversation_details.conversation_id,
                                            "name": ""
                                       },
                                       "recipient": {
                                            "id": data.conversation_details.user_id,
                                            "name":data.conversation_details.user_name
                                        },
                                        "text": sendmessage,
                                        "replyToId": "3236fa10-4b88-11e9-9a61-233bf450fb8d"
                                  }
                                    
                                    // Set the headers
                                    var headers = {'Content-Type': 'application/json','Authorization':'Bearer '+tokendata} 
          
                                    // Configure the request
                                    var options = {
                                        url: data.conversation_details.service_url,
                                        method: 'POST',
                                        headers: headers,
                                        json: requestData
                                    }
                                
                                    // Start the request
                                    Request(options, function (error, response, body) {
                                        if (!error && response.statusCode == 200) {                                 
                                           logger.info("Chat channel Message send Sucessfully",session.conversationData.userName);
                                            session.endDialog();
                                         
                                        }
                                        else{
                                            logger.info("Error occured when sending message to chat channel"+response.statusCode,session.conversationData.userName);
                                            session.endDialog();
                                        }      
                                    });//end
                                
                });//end of Authenticate
                });//end of Createticket response          
          }              

  });//end of execute method of AE WorkFlow
 session.endDialog();
}

//purpose:endpoint for create ticket
function EndpointCreateTicketResponse(getsession,callback)
{
 
try{
      app.post('/api/AE/createTicket', (request, response) => {    
      //response.text = request.body.conversation_details.PublicId;                
          if(request.body)
          {
              response.sendStatus(200);
           
              logger.info("Response send from AE to Chatbot with ticket id ::"+JSON.stringify(request.body),getsession.conversationData.userName);
              return callback(request.body);
          }
          else
          {
             // logger.info("Call enpoint from AE fail with error code:"+response.statusCode,getsession.conversationData.userName);
          }
     
    });
  }
  catch(e)
  {
      //logger.info("Endpoint exception:",getsession.conversationData.userName);
  }
}

///purpose:endpoint for get details of perticular ticket
function EndpointGetTicketByPerticularIDResponse(getsession,callback)
{
 
try{
app.post('/api/AE/getTicketByPerticularID', (request, response) => {    
  //response.text = request.body.conversation_details.PublicId;                
          if(request.body)
          {
              response.sendStatus(200);
               logger.info("Response send from AE to Chatbot For particular ticket ::"+ JSON.stringify(request.body),getsession.conversationData.userName);
            
              return callback(request.body);
          }
          else
          {
              logger.info("Error occured when call getticket endpoint with error code::"+response.statusCode,getsession.conversationData.userName);
          }
     
    });
  }
  catch(e)
  {
      logger.info("Endpoint exception:",getsession.conversationData.userName);
  }
}

///purpose:endpoint for get list of all open ticket
function EndpointGetTicketResponse(getsession,callback)
{  
    try{
    app.post('/api/AE/getTicket', (request, response) => {    
    //response.text = request.body.conversation_details.PublicId;                
            if(request.body)
            {
                response.sendStatus(200);
                logger.info("Response send from AE to Chatbot For allopen ticket ::"+ JSON.stringify(request.body),getsession.conversationData.userName);
            
                return callback(request.body);
            }
            else
            {
                logger.info("Error occured when call getticket endpoint with error code:"+response.statusCode,getsession.conversationData.userName);
            }
        
        });
    }
    catch(e)
    {
        logger.info("Endpoint exception:",getsession.conversationData.userName);
    }
}

//Knowladge Article
//FAQ 
bot.dialog('KnowledgeArticle',[
    function (session, args, next) { 

        var jsonData = JSON.stringify(session.message);
        var jsonParse = JSON.parse(jsonData);
        session.conversationData.channelName=jsonParse.address.channelId;

      if(process.env.Qna_Service_enabled=="no")
      {
          session.send(process.env.QNA_ServiceDown_Message);
          session.endDialog();
      }
      else
      {
      
        var qnaMakerResult;
       
        var intent = args.intent;
        var title = builder.EntityRecognizer.findEntity(intent.entities,'faq_topic');
      
        const question = session.message.text; 
        if(question.toLowerCase()=="/exit" || question.toLowerCase()=="/home" || question.toLowerCase()=="i am done")
        {
            session.send("Great! You can continue with your Ticketing Bot");
            session.endDialog();
        }
        else if(question.toLowerCase()=='/faq' || question.toLowerCase()=='/ka')
        {
            var jsonData = JSON.stringify(session.message);
            var jsonParse = JSON.parse(jsonData);
            session.conversationData.userName=jsonParse.address.user.name;
            session.send("Hello %s I'm the Knowledge Bot, your friendly virtual guide to Cherwell Knowledge articles! <p> You can say things like  <b><i>what is efax? </i></b> or <b><i>How to restore Windows 8</i></b><p> Let's get started; How can I help you today? </p> ",session.conversationData.userName);
      
        }
        else
        {
            if(title)
            {
                const bodyText = JSON.stringify({ top: 5, question: question })
                const QnaMakerUrl = process.env.QnAEndpointHostName +'/qnamaker/knowledgebases/'+ process.env.QnAKnowledgebaseId +'/generateAnswer';
                try
                {
                        Request.post({ url: QnaMakerUrl, body: bodyText, headers: {"Authorization": "EndpointKey"+ process.env.QnASubscriptionKey, "Content-Type": "application/json" } }, (err, code, body) => {
                        const response = JSON.parse(body);
                        if (response.answers.length > 0) {                   
                            //calculate length of question
                            session.dialogData.qnaMakerResult = qnaMakerResult = response;
                            var questionOptions = [];
                                    qnaMakerResult.answers.forEach(function (qna) {
                                        if (qna.score > 50) {
                                            questionOptions.push(qna.questions[0]);
                                        }
                                    });
                            
                            if(questionOptions.length == 1)
                            {       
                                session.dialogData.qnaMakerResult = qnaMakerResult = response; 
                                var sendAnswer = messageFormating.FAQAnswerMsg(session,response);
                                session.send(sendAnswer);                            
                                session.endDialog();
                            }
                            else if(questionOptions.length > 1)
                            {                                                    
                                if(session.conversationData.channelName=="skypeforbusiness")
                                {
                                        var questionOptionsList = [];
                                        qnaMakerResult.answers.forEach(function (qna) {
                                            if (qna.score > 50) {
                                                questionOptionsList.push(qna.questions[0]);
                                            }
                                        });
                                        session.send("Multiple question returned for related topic.");
                                        builder.Prompts.choice(session, "Select/Type a topic number of your interest.",questionOptionsList,{listStyle:2});                     
                                }//end of if
                               else{
                                        var MultiplequestionMessage = new builder.Message(session)
                                        var attachments = [];                            
                                        MultiplequestionMessage.attachmentLayout(builder.AttachmentLayout.carousel);
                                        var attachments=getCardsAttachmentsForFAQ(qnaMakerResult.answers);
                                        MultiplequestionMessage.attachments(attachments);
                                        session.send(MultiplequestionMessage);
                                        session.endDialog();
                                    }
                            }
                            else
                            {                       
                                    session.send("Hmmm, I didn't get that. Maybe rephrase your query and try again");
                                    session.endDialog();                            
                            }
                        }
                        else {
                            session.send("It looks like I couldn't find an asnwer for your question. Maybe I need to learn more about this topic. You can also try rephrasing the question.");                   
                            session.endDialog();
                        }         
                        });
                }
                catch(e)
                {
                    console.log("Exception when connecting with QNA Maker");
                }
            }
            else{
                session.send("It looks like you are trying to get help on some Knowledge Articles. To better understand your request rephrase your query with a question/request like <b><i>How to reboot a server?</i></b> or <b><i>help for tax engine errors</i></b> or <b><i>what is efax?</i></b>");
                session.endDialog();
                }
        }
      } 
     }, 
        function (session, results) {          
            var str=results.response.entity;
             if(results.response.entity)
             {
                    var qnaMakerResult
                    const question = str;
                     
                        const bodyText = JSON.stringify({ top: 1, question: question })
                        const QnaMakerUrl = process.env.QnAEndpointHostName +'/qnamaker/knowledgebases/'+ process.env.QnAKnowledgebaseId +'/generateAnswer';
                        try
                        {
                            
                                Request.post({ url: QnaMakerUrl, body: bodyText, headers: {"Authorization": "EndpointKey"+ process.env.QnASubscriptionKey, "Content-Type": "application/json" } }, (err, code, body) => {
                                const response = JSON.parse(body);
                                if (response.answers.length > 0) {
    
                                    session.dialogData.qnaMakerResult = qnaMakerResult = response;                
                                    var ans=response.answers[0].answer;              
                                    // Create an instance of the turndown service
                                    // let turndownService = new TurndownService();                        
                                    // let markdown = turndownService.turndown(ans);
                                    session.send(ans);   
                                    session.endDialog();           
                                }
                                else {
                                    session.send("It looks like I couldn't find an asnwer for your question. Maybe I need to learn more about this topic. You can also try rephrasing the question.");                   
                                   session.endDialog();
                                }         
                                });
                        }
                        catch(e)
                        {
                            console.log("Exception when connecting with QNA Maker");
                            session.endDialog();
                        }       
            }
            else
            {     
               session.send("Please Select Option"); 
               session.endDialog();
            }
        }
           
]).triggerAction({
    matches: 'FAQ'
});


function getCardsAttachmentsForFAQ(data)
{
    var attachments=[];
    var i;
    for(i=0;i<data.length;i++)
    {
        var valueofmetadata=data[i].metadata;
        if(valueofmetadata.length>=1)
        {
            var ans="https:"+ valueofmetadata[0].value;   

        }
        else{
            var ans="";
        }
        var card = {
            'contentType': 'application/vnd.microsoft.card.adaptive',
            'content': {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.0",
                "body": [                    
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "ColumnSet",
                                "columns": [
                                    {
                                        "type": "Column",
                                        "items": [
                                            {
                                                "type": "TextBlock",
                                                "size": "Medium",
                                                "weight": "Bolder",
                                                "text": "Question: ",
                                                "wrap": true
                                            },                                               
                                        ],
                                        "width": 2
                                     },
                                    {
                                        "type": "Column",
                                        "items": [
                                            {
                                                "type": "TextBlock",
                                                "size": "Medium",
                                                "weight": "Bolder",
                                                "text": data[i].questions[0],
                                                "wrap": true
                                            }
                                        ],
                                        "width": 8
                                    },

                                ] }
                            ]
                    },
                            
                ]//body close
            ,
            "actions": [
                {
                  "type": "Action.OpenUrl",
                  "title": "View Details",
                  "url": ans
                }
              ]   
            
            
            }//content
            };
        attachments.push(card); 
    }
    return attachments;
}
                                     

        // console.log("Question:::::::" ,data[i].questions[0]);
        // console.log(" Answer:::::::: ","[View Details]"+ ans);
   
