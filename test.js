var mayga = require("./lib/maygaserver");
mayga.initialize({clientId:"abcdeg",clientSecret:"qwerty"},{debugOn:true});

mayga.addNewAppUser("welcometomayga@mayga.me",function(err,user) {
	console.dir(user);
	mayga.getUserToken("welcometomayga@mayga.me",function(err,token) {
		console.dir(token);
	});
});
