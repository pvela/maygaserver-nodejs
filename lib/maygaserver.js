/*
The MIT License (MIT)

Copyright (c) 2011 Prabhu Velayutham

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
var https = require('https');
var http = require('http');
var querystring = require('querystring');

var headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'accept': 'application/json'
};
var initialized = false;
var debugOn = false;
var username;
var password;
var authToken;
    var bearerHeader = "Bearer ";
    var basicAuthHeader = "Basic ";
    var addUserPath="/external/1.0/addAppUser"; // send email parameter and app bearer token
    var getTokenPath="/signUp/getToken"; // send basic auth
    var getUserTokenPath="/external/1.0/getUserToken"; // send email parameter and app bearer token
    var defaultTokenEndpoint="/integration/mayga/usertoken/:userEmail";

//Error message resources are maintained globally in one place for easy management
var ERROR_MESSAGES = {
    emailEmpty: 'Invalid email address. Please set the correct email address',
    apiError: 'API returned an error, check logs for more details'
};

// protocol and debugon are optional
/*
	(required) credentials :
		(required) clientId
		(required) clientSecret

	(optional) options : 
		(optional) debugOn = true / false
		(optional) server = restify or express server object
		(optional) endpoint = endpoint url to expose this api default : /integration/mayga/getToken/:userEmail
		
*/
exports.initialize = function(credentials, options) {
    if (!credentials.clientId || !credentials.clientSecret) {
        throw 'clientId and clientSecret cannot be empty, set valid values';
    }
    username = credentials.clientId;
    password = credentials.clientSecret;
    debugOn = options.debugon?debugon:false;
    if (options.server) {
	options.server.post(options.endpoint?options.endpoint:'/integration/mayga/getToken/:userEmail', function(req, res) {
		exports.getUserToken(userEmail,function(err,token) {
			res.setHeader('Content-Type','application/json');
			if (err) {
				res.statusCode = 500;
                		res.setHeader('x-mayga-status','Token Error');
				res.sent({err:err});
			} else {
				res.statusCode = 201;
				res.setHeader('x-mayga-status','Success');
            			res.send({token:token});
			}
		});	
	});
    }
    initialized = true;
}

function getBearerAuth(callback) {
	if (!authToken) {
		exports.getAuthToken(function(err,token) {
			log(err);
			log("got bearer token "+token);
			console.dir(token);
			authToken=token.access_token;
			callback( bearerHeader+authToken);
		});
	} else {
		callback( bearerHeader+authToken);
	}
}
function getBasicAuth() {
	return basicAuthHeader+new Buffer(username + ':' + password).toString('base64');
}
exports.getAuthToken = function(callback) {
	sendRequest(getTokenPath,"POST",getBasicAuth(),{"grant_type":"client_credentials"},function(err,token) {
		callback(err,token);
	});
}
exports.getUserToken = function(userEmail, callback) {
	getBearerAuth(function(bearerToken) {
		sendRequest(getUserTokenPath,"POST",bearerToken,{"email":userEmail},function(err,token) {
			callback(err,token);
		});
	});
}
exports.addNewAppUser = function(userEmail, callback) {
    if (!userEmail) {
        sendError(callback, new Error(ERROR_MESSAGES.emailEmpty));
    } else {
	//send request to api
	getBearerAuth(function(bearerToken) {
		sendRequest(addUserPath, "POST",bearerToken,{email:userEmail},function(err, user) {
			if (err) {
        			sendError(callback, err, new Error(ERROR_MESSAGES.apiError));
			}
			log(user);
			callback(err,user);
		});
	});
    }
}

function sendRequest(path, method, authHeader, postData, callback) {
    if (!initialized) {
        throw 'maygaserver not initialized, call mayaserver.initialize(clientId, clientSecret) first before calling any maygaserver API';
    }
    var data = querystring.stringify(postData);
    headers['Authorization']=authHeader;
    if (method === 'POST') {
	headers['Content-Length'] = data.length;
    }
    options = {
        host: 'localhost',
        port: 8081,
        path: '',
        method: method,
        headers: headers
    };
    options.path = path;
    log(options);
    var request;
        request = http.request(options);
    if (method == 'POST') {
	request.write(data);	
    }
    request.end();
    var responseReturn = '';
    request.on('response', function(response) {
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            responseReturn += chunk;
        });
        response.on('end', function() {
            log('response ended');
            if (callback) {
                var retJson = responseReturn;
                var err = null;
                try {
                    retJson = JSON.parse(responseReturn);
                } catch (parsererr) {
                    // ignore parser error for now and send raw response to client
                    log(parsererr);
                    log('could not convert API response to JSON, above error is ignored and raw API response is returned to client');
                    err = parsererr;
                }
                callback(err, retJson);
            }
        })
        response.on('close', function(e) {
            log('problem with API request detailed stacktrace below ');
            log(e);
            callback(e);
        });
    });
    request.on('error', function(e) {
        log('problem with API request detailed stacktrace below ');
        log(e);
        callback(e);
    });
}

function sendError(callback, err, returnData) {
    // Throw the error in case if there is no callback passed
    if (callback) {
        callback(err, returnData);
    } else {
        throw err;
    }
}

//Logging in one place to make it easy to move to logging library like winston later.
function log(logMsg) {
    if (logMsg instanceof Error) console.log(logMsg.stack);
    if (debugOn) {
        if (typeof logMsg == 'object') {
            console.dir(logMsg);
        } else {
            console.log(logMsg);
        }
    }
}
