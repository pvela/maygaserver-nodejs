maygaserver-nodejs
==================
A nodejs wrapper for mayga (mayga.me) messaging API to enable in app messaging

Installation Instructions :
===========================

Download and Install lib/maygaserver.js in your lib

or

use "npm install maygaserver -g"

Usage :
=======
if installed by downloading the file

	var maygaserver = require('./lib/maygaserver');

for NPM based install

	var maygaserver = require('maygaserver');

Then initialize the library

	maygaserver.initialize(credentials, options);

The parameters to the initialize call are :

	(required) credentials :
        	(required) clientId from mayga.me
        	(required) clientSecret from mayga.me

	(optional) options :
		(optional) debugOn = true / false
        	(optional) server = restify or express server object
        	(optional) endpoint = endpoint url to expose this api default : /integration/mayga/getToken/:userEmail


List of API's supported by the library.
=======================================

###Add a new User

        maygaserver.addNewAppUser(userEmail,callback)

###Get Authroization Token for server side integration

        maygaserver.getAuthToken(callback);


###Get Authroization Token on behalf of the user for client side integration

        maygaserver.getUserToken(email, callback);

###Example :

	maygaserver.initialize({clientId:"abcdeg",clientSecret:"qwerty"},{debugOn:true});

	maygaserver.addNewAppUser("welcometomayga@mayga.me",function(err,user) {
        	console.dir(user);
        	maygaserver.getUserToken("welcometomayga@mayga.me",function(err,token) {
                	console.dir(token);
        	});
	});

