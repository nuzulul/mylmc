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

var auth0redirect = "https://0f3gpy-ip-114-5-110-47.tunnelmole.net" //dev
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
					let user = data.user
					existUser(user)
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
	let html = `
		<div class="block-title">Selamat Datang</div>
		<div class="list list-strong-ios list-dividers-ios list-outline-ios">
		  <ul>
			<li>
			  <div class="item-content item-input">
				<div class="item-inner">
				  <div class="item-title item-label">Masukkan invite code</div>
				  <div class="item-input-wrap">
					<input class="invite" type="text" placeholder="" />
				  </div>
				</div>
			  </div>
			</li>		  
			</ul>
		</div>
		<button class="button button-fill submit" style="width:100px;">Submit</button>
	`
	
	$('.mainarea').html(html)
	
	$('.submit').on('click',()=>{
		let invite = $('.invite').val()
		
		if(invite !== "")
		{
			sendInvite(invite)
		}
	})
}

const sendInvite = async (invite) => {
	
		let mypreloader = app.dialog.preloader();
		
		const input = {userToken,invite}
		
		const data = new URLSearchParams({
            command: 'invite',
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
				$('.mainarea').html('')
				existUser(data)
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

/////////////////
const existUser = async (user) => {
	
	window.datauser = user
	
	let html = `
		<div class="block-title">Selamat datang, ${user[2]}</div>
	`
	$('.mainarea').html(html)
	
	let gruparr = JSON.parse(user[5])
	
	html = ``
	
	for(const grup of gruparr){
		html += `
			<button class="button button-fill bukagrup bg-color-green" data-grupid="${grup.grupid}" style="width:100px;height:100px;margin-bottom:5px;margin-right:5px;"><span style="font-size:0.7em;display:none">${grup.grupid}</span>${grup.namagrup}</button>
	`
	}
	
	html += `
		<button class="button button-fill grupbaru" style="width:100px;">Tambah Grup</button>
	`
	
	$('.mainarea').append(html)

	$('.grupbaru').on('click',()=>{
		app.dialog.confirm('', 'Tambah grup baru?', callbackOkGrupbaru)
	})
	
	$('.bukagrup').on('click',async (e)=>{
		let grupid = e.srcElement.dataset.grupid
		console.log()
		const res = await fetch("/pages/grup.html")      
		var statushtml = await res.text()
		app.views.main.router.navigate({url:"/dynamicLoad/", route:{content:statushtml}});
		grupPage(grupid)
	})	
	
}


const grupPage = async (grupid) => {
	
		$('.gruparea').html('<button class="button button-fill siswabaru" style="width:100px;">Tambah Siswa</button>')
		
		$('.siswabaru').on('click',()=>{
			siswaBaru(grupid)
		})

		let mypreloader = app.dialog.preloader();
		
		const input = {userToken,grupid}
		
		const data = new URLSearchParams({
            command: 'grupdata',
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
				$('.mainarea').html('')
				grupContent(data)
				window.datatemp = data
			}
			else if (status == "failed")
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			  window.datatemp = ''
			}
			else
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			  window.datatemp = ''
			}		
		}).catch(function (err) {
			// There was an error
			console.warn('Something went wrong.', err);
			mypreloader.close();
		});	
	
}

const siswaBaru = async (grupid,edit) => {
	
	let mygrupid = grupid
  let title = edit ? 'Edit Siswa' : 'Tambah Siswa'
  var dialog = app.dialog.create({
    title: title,
    content:''////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      +'<div style="width:100%;height:50vh;overflow:auto;">'
      +'  <div style="display:flex;flex-direction:column;align-items:center;justify-content: center;">'
      +'  <div class="list no-hairlines-md" style="width:100%;">'
      +'    <ul>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Nama</div><div class="item-input-wrap">'
      +'            <input type="text" id="nama" name="nama" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Jenis Kelamin</div><div class="item-input-wrap">'
      +'                            <select id="jeniskelamin" name="jeniskelamin">'
      +'                              <option value=""></option>'
      +'                              <option value="Laki-Laki">Laki-Laki</option>'
      +'                              <option value="Perempuan">Perempuan</option>'
      +'                            </select>'
      +'            </div></div>'
      +'        </li>'	  
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Tempat Tanggal Lahir</div><div class="item-input-wrap">'
      +'            <input type="text" id="tempattanggallahir" name="tempattanggallahir" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Nomer HP</div><div class="item-input-wrap">'
      +'            <input type="text" id="nomerhp" name="nomerhp" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Alamat Asal</div><div class="item-input-wrap">'
      +'            <input type="textarea" id="alamatasal" name="alamatasal" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Alamat Domisili</div><div class="item-input-wrap">'
      +'            <input type="textarea" id="alamatdomisili" name="alamatdomisili" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Lulusan SMA</div><div class="item-input-wrap">'
      +'            <input type="text" id="lulusansma" name="lulusansma" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Status Orang Tua</div><div class="item-input-wrap">'
      +'                            <select id="statusortu" name="statusortu">'
      +'                              <option value=""></option>'
      +'                              <option value="Kader">Kader</option>'
      +'                              <option value="Non Kader">Non Kader</option>'	  
      +'                            </select>'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Program Studi</div><div class="item-input-wrap">'
      +'            <input type="text" id="programstudi" name="programstudi" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Fakultas</div><div class="item-input-wrap">'
      +'            <input type="text" id="fakultas" name="fakultas" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Tahun Masuk Unair</div><div class="item-input-wrap">'
      +'            <input type="text" id="tahunmasukunair" name="tahunmasukunair" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Level Pembinaan</div><div class="item-input-wrap">'
      +'            <input type="text" id="levelpembinaan" name="levelpembinaan" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Tahun Masuk Mulai Pembinaan / Mentoring</div><div class="item-input-wrap">'
      +'            <input type="text" id="tahunmulaipembinaan" name="tahunmulaipembinaan" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Materi yang Sudah Disampaikan</div><div class="item-input-wrap">'
      +'            <input type="textarea" id="materi" name="materi" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Kegiatan yang Sudah Diikuti</div><div class="item-input-wrap">'
      +'            <input type="textarea" id="kegiatan" name="kegiatan" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Keterangan</div><div class="item-input-wrap">'
      +'            <input type="textarea" id="keterangan" name="keterangan" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Catatan</div><div class="item-input-wrap">'
      +'            <input type="textarea" id="catatan" name="catatan" placeholder="" value="">'
      +'            </div></div>'
      +'        </li>'
      +'    </ul>'
      +'  </div>'
      +'  </div>'
      +'</div>',//////////////////////////////////////////////////////////////////////////////////////////////////
    closeByBackdropClick: false,
    destroyOnClose: true,
    verticalButtons: true,
    on: {
      opened: function () {
		
		if(edit){
			/*let arr = JSON.parse(bsmr)
			let data = arr[parseInt(idx)]
			$$('#namasekolah').val(safe(data.namasekolah))
			$$('#alamatsekolah').val(safe(data.alamatsekolah))
			$$('#nomorbsmr').val(safe(data.nomorbsmr))
			$$('#tahunpendirianbsmr').val(safe(data.tahunpendirianbsmr))
			$$('#jumlahanggotabsmr').val(safe(data.jumlahanggotabsmr))
			$$('#picbsmr').val(safe(data.picbsmr))
			$$('#piccabangid').val(safe(data.piccabangid))
			$$('#namasekolah').attr('disabled','true')
			*/
		}
		
      }
    },
    buttons: [
      {
        text: 'Simpan',
        close:true,
        color: 'red',
        onClick: function(dialog, e)
          {
				var nama = $('#nama').val();
				var jeniskelamin = $('#jeniskelamin').val();
				var tempattanggallahir = $('#tempattanggallahir').val();
				var nomerhp = $('#nomerhp').val();
				var alamatasal = $('#alamatasal').val();
				var alamatdomisili = $('#alamatdomisili').val();
				var lulusansma = $('#lulusansma').val();
				var statusortu = $('#statusortu').val();
				var programstudi = $('#programstudi').val();
				var fakultas = $('#fakultas').val();
				var tahunmasukunair = $('#tahunmasukunair').val();
				var levelpembinaan = $('#levelpembinaan').val();
				var tahunmulaipembinaan = $('#tahunmulaipembinaan').val();
				var materi = $('#materi').val();
				var kegiatan = $('#kegiatan').val();
				var keterangan = $('#keterangan').val();
				var catatan = $('#catatan').val();
				
				if(edit){
					
				}else{
					let siswa = {nama,jeniskelamin,tempattanggallahir,nomerhp,alamatasal,alamatdomisili,lulusansma,statusortu,programstudi,fakultas,tahunmasukunair,levelpembinaan,tahunmulaipembinaan,materi,kegiatan,keterangan,catatan}
					if (window.datatemp && window.datatemp !== '' && window.datatemp[1] === mygrupid){
						let siswaarr = JSON.parse(datatemp[3])
						siswaarr.push(siswa)
						grupSave(mygrupid,JSON.stringify(siswaarr))
					}
				}
          }
      },
      {
        text: 'Batal',
        close:true,
        color: 'gray',
        onClick: function(dialog, e)
          {

          }
      },
    ]
  });
  dialog.open();	
	
}

const grupSave = async (mygrupid,siswaarr) => {
		let mypreloader = app.dialog.preloader();
		
		const input = {userToken,grupid:mygrupid,siswaarr}
		
		const data = new URLSearchParams({
            command: 'grupsave',
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
				grupPage(data)
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

const grupContent = async (data) => {
	console.log(data)
}


const callbackOkGrupbaru = async () => {
		let mypreloader = app.dialog.preloader();
		
		const input = {userToken}
		
		const data = new URLSearchParams({
            command: 'grupbaru',
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
				$('.mainarea').html('')
				existUser(data)
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
