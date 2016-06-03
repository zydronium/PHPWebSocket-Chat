var Server;

var session = {};
var chatlogs = {};

function log( text ) {
	$log = $('#log');
	//Add text to log
	$log.append(($log.val()?"\n":'')+text);
	//Autoscroll
	$log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
}

function send( text ) {
	Server.send( 'message', text );
}

function sendMessage ( text, userid ) {
	var message = '{"command": "MSG","sender": '+session.userid+',"reciever": '+session.userid+',"message":{"text":"'+text+'"}}';//2e userid moet reciever id worden, doorgegeven via userid param
	send(message);
}

function connect() {
	log('Connecting...');
	Server = new FancyWebSocket('ws://127.0.0.1:9300');

	$('#message').keypress(function(e) {
		if ( e.keyCode == 13 && this.value ) {
			log( 'You: ' + this.value );
			sendMessage( this.value );

			$(this).val('');
		}
	});

	//Let the user know we're connected
	Server.bind('open', function() {
		log( "Connected." );
	});

	//OH NOES! Disconnection occurred.
	Server.bind('close', function( data ) {
		log( "Disconnected." );
	});

	//Log any messages sent from server
	Server.bind('message', function( payload ) {
		log( payload );
		var obj = JSON.parse(payload);
		switch(obj.command) {
		    case "HELO":
		        session.userid = obj.message.id;
		        session.userlist = obj.message.userlist;
		        for(var user of obj.message.userlist) {
		        	$('#userlist').$('.collection').$('#'+user).append('<a href="#!" id="'+obj.message.id+'" class="collection-item">'+obj.message.username+'<span class="new badge">0</span></a>');
		        }
		        session.encrypt = obj.message.encryptStatus;
		        break;
		    case "QUIT":
		        delete session.userlist[obj.message.id];
		        $('#userlist').$('.collection').$('#'+obj.message.id).delete();
		        break;
		    case "ANN":
		    	session.userlist[obj.message.id] = {};
		        session.userlist[obj.message.id].username = obj.message.username;
		        session.userlist[obj.message.id].pubkey = obj.message.pubkey;
		        session.userlist[obj.message.id].chatlog = "";
		        session.userlist[obj.message.id].newmessages = 0;
		        $('#userlist').$('.collection').$('#'+obj.message.id).append('<a href="#!" id="'+obj.message.id+'" class="collection-item">'+obj.message.username+'<span class="new badge">0</span></a>');
		        break;
		    case "MSG":
		        console.log("msg");
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

	$('#username-form').keypress(function(e) {
		if ( e.keyCode == 13 && this.value ) {
			login();
			$('#modal1').closeModal();
		}
	});
	$('#modal-close').on("click", function() {
		login();
	});
});

function login() {
	session.username = $('#username-form').val() ? $('#username-form').val() : "User";
	$('#username').text(session.username);

	//TODO generate pub key
	session.pubkey = "";

	var message = '{"command": "ANN", "message":{"id": '+session.userid+', "username":"'+session.username+'","pubkey":"'+session.pubkey+'"}}';
	send(message);
}