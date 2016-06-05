var Server;

var session = {};
session.openchat = 999;
session.userlist = {};
session.userlist[999] = {};
session.userlist[999].chat="";
var chatlogs = {};

// The passphrase used to repeatably generate this RSA key.
var PassPhrase = randString(20);

// The length of the RSA key, in bits.
var Bits = 512; 

session.rsakey = cryptico.generateRSAKey(PassPhrase, Bits);
session.pubkey = cryptico.publicKeyString(session.rsakey);

function updateLog() {
	$log = $('#log');
	//Add text to log
	$log.val(session.userlist[session.openchat].chat);
	$log.trigger('autoresize');
	//Autoscroll
	$log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
}

function log( text ) {
	session.userlist[session.openchat].chat+=(text+"\n");
	updateLog()
}

function send( text ) {
	Server.send( 'message', text );
}

function sendMessage ( text, userid ) {
	if(session.encrypt == 1) {
		var EncryptResult = cryptico.encrypt(text, session.userlist[userid].pubkey);
		text = EncryptResult.cipher;
	}
	var message = '{"command": "MSG","sender": '+session.userid+',"reciever": '+userid+',"message":{"text":"'+text+'"}}';//2e userid moet reciever id worden, doorgegeven via userid param
	send(message);
}

function connect() {
	console.log('Connecting...');
	//lokale server:
	//Server = new FancyWebSocket('ws://127.0.0.1:9300');
	//Jelle's server:
	Server = new FancyWebSocket('ws://chat.123apps.net:9300');


	$('#message').keypress(function(e) {
		if ( e.keyCode == 13 && this.value ) {
			log( 'You: ' + this.value );
			sendMessage( session.username + ': ' + this.value, session.openchat );

			$(this).val('');
			$(this).trigger('autoresize');
		}
	});

	//Let the user know we're connected
	Server.bind('open', function() {
		console.log( "Connected." );
	});

	//OH NOES! Disconnection occurred.
	Server.bind('close', function( data ) {
		console.log( "Disconnected." );
	});

	//Log any messages sent from server
	Server.bind('message', function( payload ) {
		//log( payload );
		var obj = JSON.parse(payload);
		switch(obj.command) {
		    case "HELO":
		        session.userid = obj.message.id;
		        session.userlist = obj.message.userList;
				
		        for(var user in obj.message.userList) {
					if (obj.message.userList[user].id !== session.userid) {
						$('#userlist .collection').append('<a href="#!" id="'+obj.message.userList[user].id+'" class="collection-item userlist-user">'+obj.message.userList[user].username+'</a>');
						session.userlist[user].chat = "";
						session.userlist[user].newmessages = 0;
					}
		        }
		        session.encrypt = obj.message.encryptStatus;
		        break;
		    case "QUIT":
		        delete session.userlist[obj.message.id];
		        $('#userlist .collection #'+obj.message.id).remove();
				session.openchat = 999;
				$('#message').attr("disabled", true);
				$('#log').val('');
		        break;
		    case "ANN":
		    	session.userlist[obj.message.id] = {};
		        session.userlist[obj.message.id].username = obj.message.username;
		        session.userlist[obj.message.id].pubkey = obj.message.pubkey;
		        session.userlist[obj.message.id].chat = "";
		        session.userlist[obj.message.id].newmessages = 0;
		        $('#userlist .collection').append('<a href="#!" id="'+obj.message.id+'" class="collection-item userlist-user">'+obj.message.username+'</a>');
		        break;
		    case "MSG":
				var text = obj.message.text;
				if(session.encrypt == 1) {
					console.log("Cypto text: "+text);
					console.log("private key: "+session.rsakey);
					var DecryptResult = cryptico.decrypt(text, session.rsakey);
					text = DecryptResult.plaintext;
				}
				console.log(obj.message.text);
				console.log(session.userlist[obj.sender].chat);
				session.userlist[obj.sender].chat+=(text+"\n");
				console.log(session.userlist[obj.sender].chat);
				console.log("sender = " + obj.sender);
				if(session.openchat != obj.sender) {
					session.userlist[obj.sender].newmessages++;
					if(typeof $('#'+obj.sender+' .badge').html() !== "undefined" ) {
						$('.badge').text(session.userlist[obj.sender].newmessages);
					} else {
						console.log("make label");
						$('.collection #'+obj.sender).html($('.collection #'+obj.sender).html() + '<span class="new badge">'+session.userlist[obj.sender].newmessages+'</span>');
					}
				} else {
					updateLog();
				}
				//console.log("message recieved!");
				//console.log(obj);
		        break;
			case "LOCK":
				session.encrypt = obj.message.encryptStatus;
				console.log("encrypt = "+session.encrypt);
				break;
		    default:
		        console.log("default");
		}
	});

	Server.connect();
}

$(document).ready(function() {
	connect();
	$('#modal1').openModal();
	//login on keypress
	$('#username-form').keypress(function(e) {
		if ( e.keyCode == 13 && this.value ) {
			login();
			$('#modal1').closeModal();
		}
	});
	//login on close button
	$('#modal-close').click(function() {
		login();
	});
	//switch chats
	$('#userlist .collection').on("click", ".userlist-user", function(evt) {
		if(session.openchat === 999) {
			$('#message').removeAttr("disabled");
		}
		console.log($(this).attr("id"));
		$('#userlist .collection .userlist-user').removeClass("active");
		$(this).addClass("active");
		
		session.openchat = $(this).attr("id");
		updateLog();
		session.userlist[session.openchat].newmessages = 0;
		$('.collection #'+session.openchat).html(session.userlist[session.openchat].username);
		$('#reciever').text(session.userlist[session.openchat].username);
	});
});

function login() {
	session.username = $('#username-form').val() ? $('#username-form').val() : "User";
	$('#username').text(session.username);

	//TODO generate pub key
	//session.pubkey = "";
	//session.rsakey = "";

	var message = '{"command": "ANN", "message":{"id": '+session.userid+', "username":"'+session.username+'","pubkey":"'+session.pubkey+'"}}';
	send(message);
}

function randString(x){
    var s = "";
    while(s.length<x&&x>0){
        var r = Math.random();
        s+= (r<0.1?Math.floor(r*100):String.fromCharCode(Math.floor(r*26) + (r>0.5?97:65)));
    }
    return s;
}