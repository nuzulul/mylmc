////////////////////////////////////
var getParams = function (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};
var params = getParams(window.location.href);

var auth0redirect = "https://gk9caj-ip-114-5-242-132.tunnelmole.net" //dev
var isLocal = false;
var userToken = ""

if (window.location.href.indexOf("https://mylmc.press.my.id") > -1)
{
  var apidataurl = "https://script.google.com/macros/s/AKfycby93nU7-7uxh2p8TaVkRy8GpBayRd6zbY0W-ETGmmTuqSrg49Wud3Ityrt5MCcTCl_Ntg/exec";
  auth0redirect = "https://mylmc.press.my.id"
}
else
{
  console.log('local development');
  isLocal = true;
  var access_token = '';
  if(localStorage.hasOwnProperty('dev')){
	  access_token = atob(localStorage.getItem('dev'))
  }
  var apidataurl = "https://script.google.com/macros/s/AKfycbwhzr7l6s7MxYN3nYemIH91nuxsWvKHdOxIdfIqiIae/dev?access_token="+access_token;
}


//////////////////app////////////////////////////////////////

var $ = Dom7;


var app = new Framework7({
  name: 'MyLMC', // App name
  theme: 'auto', // Automatic theme detection
  colors: {
    primary: '#007aff',
  },

  el: '#app', // App root element

  // App store
  store: store,
  // App routes
  routes: routes,
});
// Login Screen Demo
$('#my-login-screen .login-button').on('click', function () {
  var username = $('#my-login-screen [name="username"]').val();
  var password = $('#my-login-screen [name="password"]').val();

  // Close login screen
  app.loginScreen.close('#my-login-screen');

  // Alert username and password
  app.dialog.alert('Username: ' + username + '<br/>Password: ' + password);
});



//////dev mode/////////////////////////////////////////////////////////
if (isLocal)
{
 let des = ""
  if(localStorage.hasOwnProperty('dev')){
	  des = localStorage.getItem('dev')
  }
  app.dialog.prompt(des, 'DEV MODE', function (pwd){fdevmode(pwd);})
}
function fdevmode(pwd)
{
		let mypreloader = app.dialog.preloader();
		
		const data = new URLSearchParams({
            password: pwd
        })		
		
		fetch("https://script.google.com/macros/s/AKfycbxFGHt1NKZ7m7QWeT4Yos4KjAat7xk9q3R2Q2TUNRymZYaGziVxGuEojQf9WbhvGzAK-g/exec", {
			body: data,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "post",
		})
		.then(function (response) {
			// The API call was successful!
			if (response.ok) {
				return response.text();
			} else {
				return Promise.reject(response);
			}
		}).then(function (data) {
			// This is the data from our response
			mypreloader.close();

			var status = JSON.parse(data).status;
			var data = JSON.parse(data).data;
			if (status == "success")
			{
				//console.log(data);
				localStorage.setItem("dev",btoa(data))
			}
			else if (status == "failed")
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			}
			else
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			}		
		}).catch(function (err) {
			// There was an error
			console.warn('Something went wrong.', err);
			mypreloader.close();
		});
}


///////////////////auth//////////////////////

let auth0Client = null;
const configureClient = async () => {

  auth0Client = await auth0.createAuth0Client({
    domain: 'dev-g11adqtyxnwtc4sx.us.auth0.com',
    clientId: 'e0O93eEHDeU81Nh9twSd613EovnZ5SMa',
    authorizationParams: {audience:'api'},
    useRefreshTokens: true
  });
};

window.onload = async () => {
  console.log('configure 0auth')
  await configureClient();
  
  console.log('check isAuthenticated')
  const isAuthenticated = await auth0Client.isAuthenticated();
  
  console.log('isAuthenticated',isAuthenticated)
  
  if (isAuthenticated) {
    // show the gated content
    
    // update the UI state
    updateUI();    
    
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    try {

      // Process the login state
      console.log('check handleRedirectCallback')
      await auth0Client.handleRedirectCallback();

      //updateUI();

      // Use replaceState to redirect the user away and remove the querystring parameters
      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }      
  }else if(query.includes("error=") && query.includes("error_description=")) {
    try {

      // Use replaceState to redirect the user away and remove the querystring parameters
      window.history.replaceState({}, document.title, "/");
	  console.log('error')
    } catch (err) {
      console.log("Error parsing redirect:", err);
    } 	  
  }	  

  // update the UI state
  updateUI();  
  
};

// NEW
const updateUI = async () => {
  try {
    const isAuthenticated = await auth0Client.isAuthenticated();

    console.log('update ui')

    if(isAuthenticated){
		 const token = await auth0Client.getTokenSilently();
		 const user = await auth0Client.getUser()
		localStorage.setItem("token",token)	 
 		startUser(token)
		console.log('yes')
    }else{
      $('#overlay-welcome').css('display', 'flex');
		console.log('no')
    }
  } catch (err) {
    console.log("Error updating UI!", err);
    return;
  }  
};

const login = async () => {
  try {
    await auth0Client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: auth0redirect
      }
    });
  } catch (err) {
    console.log("Log in failed", err);
  }    
};

const logout = () => {
  try {
    auth0Client.logout({
      logoutParams: {
        returnTo: auth0redirect
      }
    });
  } catch (err) {
    console.log("Log out failed", err);
  }    
};

$('.login-screen-openauth0').on('click',()=>{
	console.log('ok')
	login()
})

$('.logout-auth0').on('click',()=>{
	console.log('ok')
	localStorage.removeItem('token')
	logout()
})



/////////////////
const startUser = async (token) => {

		let mypreloader = app.dialog.preloader();
		
		const input = {token}
		
		const data = new URLSearchParams({
            command: 'start',
			input : JSON.stringify(input)
        })		
		
		fetch(apidataurl, {
			body: data,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "post",
		})
		.then(function (response) {
			// The API call was successful!
			if (response.ok) {
				return response.text();
			} else {
				return Promise.reject(response);
			}
		}).then(function (data) {
			// This is the data from our response
			mypreloader.close();
			console.log(data)
			var status = JSON.parse(data).status;
			var data = JSON.parse(data).data;
			if (status == "success")
			{
				console.log(data);
				mypreloader.close();
				userToken = data.accessToken
				$('#overlay-welcome').hide()
				if(data.type == "new"){
					newUser()
				}else if(data.type == "exist"){
					existUser()
				}
			}
			else if (status == "failed")
			{
			  localStorage.removeItem('token')
			  app.dialog.alert(data,'Terjadi Kesalahan');
			}
			else
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			}		
		}).catch(function (err) {
			// There was an error
			console.warn('Something went wrong.', err);
			mypreloader.close();
		});
}


//reauth////////////////////
if(localStorage.hasOwnProperty('token')){
	let token = localStorage.getItem('token')
	startUser(token)
}


/////////////////
const newUser = async () => {
}

/////////////////
const existUser = async () => {
}
