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

var auth0redirect = "https://uxmlva-ip-114-8-226-238.tunnelmole.net" //dev
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

$('.adminmenu').hide()



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
					let info = JSON.parse(user[4])
					let usertype = info.usertype
					if(usertype === 'admin'){
						$('.adminmenu').show()
					}
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
			<button class="button button-fill bukagrup bg-color-green" data-grupid="${grup.grupid}" data-namagrup="${grup.namagrup}" style="width:100px;height:100px;margin-bottom:5px;margin-right:5px;"><span style="font-size:0.7em;display:none">${grup.grupid}</span>${grup.namagrup}</button>
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
		let namagrup = e.srcElement.dataset.namagrup
		console.log()
		const res = await fetch("/pages/grup.html")      
		var statushtml = await res.text()
		app.views.main.router.navigate({url:"/dynamicLoad/", route:{content:statushtml}});
		grupPage(grupid,namagrup)
	})	
	
}


const grupPage = async (grupid,namagrup) => {
	
		$('.gruparea').html(`<div class="biogrup float-left" ><span style="font-size:2em;font-weight:bold;">${namagrup}</span> <i style="cursor:pointer;font-size:1em;" class="f7-icons editnamagrup">pencil_circle</i></div><div class="float-right"><button class="button button-fill siswabaru" style="width:100px;margin-bottom:10px;">Tambah Siswa</button></div>`)
		
		$('.siswabaru').on('click',()=>{
			siswaBaru(grupid)
		})
		
		$('.editnamagrup').on('click',()=>{
			editNamagrup(grupid,namagrup)
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
				window.datagrup = data
			}
			else if (status == "failed")
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			  window.datagrup = ''
			}
			else
			{
			  app.dialog.alert(data,'Terjadi Kesalahan');
			  window.datagrup = ''
			}		
		}).catch(function (err) {
			// There was an error
			console.warn('Something went wrong.', err);
			mypreloader.close();
		});	
	
}

const editNamagrup = async (grupid,namagrup) => {
	
  let title = 'Edit Nama Grup'
  var dialog = app.dialog.create({
    title: title,
    content:''////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      +'<div style="width:100%;height:50vh;overflow:auto;">'
      +'  <div style="display:flex;flex-direction:column;align-items:center;justify-content: center;">'
      +'  <div class="list no-hairlines-md" style="width:100%;">'
      +'    <ul>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Nama Grup</div><div class="item-input-wrap">'
      +'            <input type="text" id="namagrup" name="namagrup" placeholder="" value="'+namagrup+'">'
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
		
      }
    },
    buttons: [
      {
        text: 'Simpan',
        close:true,
        color: 'red',
        onClick: function(dialog, e)
          {
				var newnamagrup = $('#namagrup').val();
				saveNamagrup(grupid,newnamagrup)
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


const saveNamagrup = async (grupid,newnamagrup) => {
		let mypreloader = app.dialog.preloader();
		
		const input = {userToken,grupid,newnamagrup}
		
		const data = new URLSearchParams({
            command: 'editnamagrup',
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
				updateNamagrup(data)
				
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

const updateNamagrup = async (data) => {
	let grupid = data.grupid
	let namagrup = data.newnamagrup
	
	window.datagrup[2] = namagrup
	
	
	
		let allgrup = JSON.parse(window.datauser[5])
		let idx = allgrup.findIndex((item)=>item.grupid === grupid)
		if(idx > -1){
			allgrup[idx].namagrup = namagrup
			let grup = JSON.stringify(allgrup)
			window.datauser[5] = grup
		}
		
	
	
	grupPage(grupid,namagrup)
}


const siswaBaru = async (grupid,edit,idx) => {
	
	let mygrupid = grupid
  let title = edit ? 'Edit Siswa' : 'Tambah Siswa'
  var dialog = app.dialog.create({
    title: title,
	cssClass: 'bigdialog',
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
      +'            <textarea type="textarea" id="alamatasal" name="alamatasal" placeholder="" value=""></textarea>'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Alamat Domisili</div><div class="item-input-wrap">'
      +'            <textarea type="textarea" id="alamatdomisili" name="alamatdomisili" placeholder="" value=""></textarea>'
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
      +'            <textarea type="textarea" id="materi" name="materi" placeholder="" value=""></textarea>'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Kegiatan yang Sudah Diikuti</div><div class="item-input-wrap">'
      +'            <textarea type="textarea" id="kegiatan" name="kegiatan" placeholder="" value=""></textarea>'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Keterangan</div><div class="item-input-wrap">'
      +'            <textarea type="textarea" id="keterangan" name="keterangan" placeholder="" value=""></textarea>'
      +'            </div></div>'
      +'        </li>'
      +'        <li class="item-content item-input"><div class="item-inner"><div class="item-title item-label">Catatan</div><div class="item-input-wrap">'
      +'            <textarea type="textarea" id="catatan" name="catatan" placeholder="" value=""></textarea>'
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
		
		if(edit && window.datagrup && window.datagrup !== '' && window.datagrup[1] === mygrupid){
			
			let siswaarr = JSON.parse(window.datagrup[3])
			let siswa = siswaarr[parseInt(idx)]
			
			$('#nama').val(safe(siswa.nama));
			
			$('#jeniskelamin').val(safe(siswa.jeniskelamin));
			$('#tempattanggallahir').val(safe(siswa.tempattanggallahir));
			$('#nomerhp').val(safe(siswa.nomerhp));
			$('#alamatasal').val(safe(siswa.alamatasal));
			$('#alamatdomisili').val(safe(siswa.alamatdomisili));
			$('#lulusansma').val(safe(siswa.lulusansma));
			$('#statusortu').val(safe(siswa.statusortu));
			$('#programstudi').val(safe(siswa.programstudi));
			$('#fakultas').val(safe(siswa.fakultas));
			$('#tahunmasukunair').val(safe(siswa.tahunmasukunair));
			$('#levelpembinaan').val(safe(siswa.levelpembinaan));
			$('#tahunmulaipembinaan').val(safe(siswa.tahunmulaipembinaan));
			$('#materi').val(safe(siswa.materi));
			$('#kegiatan').val(safe(siswa.kegiatan));
			$('#keterangan').val(safe(siswa.keterangan));
			$('#catatan').val(safe(siswa.catatan));
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
					
					let siswa = {nama,jeniskelamin,tempattanggallahir,nomerhp,alamatasal,alamatdomisili,lulusansma,statusortu,programstudi,fakultas,tahunmasukunair,levelpembinaan,tahunmulaipembinaan,materi,kegiatan,keterangan,catatan}
					let siswaarr = JSON.parse(datagrup[3])
					siswaarr[parseInt(idx)] = siswa
					grupSave(mygrupid,JSON.stringify(siswaarr))
				}else{
					let siswa = {nama,jeniskelamin,tempattanggallahir,nomerhp,alamatasal,alamatdomisili,lulusansma,statusortu,programstudi,fakultas,tahunmasukunair,levelpembinaan,tahunmulaipembinaan,materi,kegiatan,keterangan,catatan}
					if (window.datagrup && window.datagrup !== '' && window.datagrup[1] === mygrupid){
						let siswaarr = JSON.parse(window.datagrup[3])
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
	let siswaarr = JSON.parse(data[3])
	
	let html = `<div style="clear:both;" class="data-table data-table-collapsible data-table-init siswa"><table><thead><tr><th>Nama</th><th>Jenis Kelamin</th><th>Tempat Tanggal Lahir</th><th>Nomer HP</th><th>Alamat Asal</th><th>Alamat Domisili</th><th>Lulusan SMA</th><th>Status Orang Tua</th><th>Program Studi</th><th>Fakultas</th><th>Tahun Masuk Unair</th><th>Level Pembinaan</th><th>Tahun Masuk Mulai Pembinaan / Mentoring</th><th>Materi yang Sudah Disampaikan</th><th>Kegiatan yang Sudah Diikuti</th><th>Keterangan</th><th>Catatan</th><th></th></tr></thead><tbody>`
	
	for (var i=0;i<siswaarr.length;i++){
		let siswa = siswaarr[i]
		html += `
			<tr>
				<td data-collapsible-title="Nama">${safe(siswa.nama)}</td>
				<td data-collapsible-title="Jenis Kelamin">${safe(siswa.jeniskelamin)}</td>
				<td data-collapsible-title="Tempat Tanggal Lahir">${safe(siswa.tempattanggallahir)}</td>
				<td data-collapsible-title="Nomer HP">${safe(siswa.nomerhp)}</td>
				<td data-collapsible-title="Alamat Asal">${safe(siswa.alamatasal)}</td>
				<td data-collapsible-title="Alamat Domisili">${safe(siswa.alamatdomisili)}</td>
				<td data-collapsible-title="Lulusan SMA">${safe(siswa.lulusansma)}</td>
				<td data-collapsible-title="Status Orang Tua">${safe(siswa.statusortu)}</td>
				<td data-collapsible-title="Program Studi">${safe(siswa.programstudi)}</td>
				<td data-collapsible-title="Fakultas">${safe(siswa.fakultas)}</td>
				<td data-collapsible-title="Tahun Masuk Unair">${safe(siswa.tahunmasukunair)}</td>
				<td data-collapsible-title="Level Pembinaan">${safe(siswa.levelpembinaan)}</td>
				<td data-collapsible-title="Tahun Masuk Mulai Pembinaan / Mentoring">${safe(siswa.tahunmulaipembinaan)}</td>
				<td data-collapsible-title="Materi yang Sudah Disampaikan">${safe(siswa.materi)}</td>
				<td data-collapsible-title="Kegiatan yang Sudah Diikuti">${safe(siswa.kegiatan)}</td>
				<td data-collapsible-title="Keterangan">${safe(siswa.keterangan)}</td>
				<td data-collapsible-title="Catatan">${safe(siswa.catatan)}</td>
				<td data-collapsible-title=""><a class="button button-fill updatesiswa" data-idx="${i}">Edit</a></td></td>
			</tr>
		`
	}
	
	html += `</tbody></table></div>`
	
	$('.gruparea').append(html)
	
	$('.updatesiswa').on('click',async (e)=>{
		let idx = e.srcElement.dataset.idx
		let grupid = data[1]
		siswaBaru(grupid,true,idx)
	})	
	
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




function escapehtmloldbrowser(s) {
    let lookup = {
        '&': "&amp;",
        '"': "&quot;",
        '\'': "&apos;",
        '<': "&lt;",
        '>': "&gt;"
    };
    return s.replace( /[&"'<>]/g, c => lookup[c] );
}


function safe(unsafe)
{
unsafe = String(unsafe);
var data = escapehtmloldbrowser(unsafe);
return data;

}
