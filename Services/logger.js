// Firstly we'll need to import the fs library
var fs = require("fs");

var Logger = (exports.Logger = {});
Logger.info = function(msg,username) {

  var message= "\r\n ----------------------------------------------------------------------- \r\n \r\n"+"Date Time:"+ new Date().toString("MM/dd/yyyy") + "\r\n" + "User Name:"+ username + "\r\n" + "Message:" + msg +"\r\n \r\n"; 
  //i//nfoStream.write(message);
 console.log(message);
  fs.appendFile('logsinfo.txt',message,function (err) {
    if (err) throw err;
    console.log('Updated!');
  });  
};


Logger.error = function(msg,username) {
  var message= "\r\n ----------------------------------------------------------------------- \r\n \r\n"+"Date Time:" + new Date().toString("MM/dd/yyyy") + "\r\n" + "User Name:"+ username + "\r\n" + "Message:" + msg +"\r\n \r\n"; 
  //i//nfoStream.write(message);
 console.log(message);
  fs.appendFile('logserror.txt',message,function (err) {
    if (err) throw err;
    console.log('Updated!');
  });  
};

