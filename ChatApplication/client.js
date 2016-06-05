var Server;

var session = {};
session.openchat = 999;
session.userlist = {};
session.userlist[999] = {};
session.userlist[999].chat="";
var chatlogs = {};

function updateLog() {
	$log = $('#log');
	//Add text to log
	$log.append(session.userlist[session.openchat].chat);
	//Autoscroll
	$log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
}

function log( text ) {
	session.userlist[session.openchat].chat+=(session.userlist[session.openchat].chat?"\n":'')+text;
	updateLog()
}

function send( text ) {
	Server.send( 'message', text );
}

function sendMessage ( text, userid ) {
	var message = '{"command": "MSG","sender": '+session.userid+',"reciever": '+userid+',"message":{"text":"'+text+'"}}';//2e userid moet reciever id worden, doorgegeven via userid param
	send(message);
}

function connect() {
	console.log('Connecting...');
	//lokale server:
	Server = new FancyWebSocket('ws://127.0.0.1:9300');
	//Jelle's server:
	//Server = new FancyWebSocket('ws://chat.123apps.net:9300');


	$('#message').keypress(function(e) {
		if ( e.keyCode == 13 && this.value ) {
			log( 'You: ' + this.value );
			sendMessage( this.value, session.openchat );

			$(this).val('');
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
				chat = session.userlist[obj.sender].chat;
				chat+=(chat?"\n":''+obj.message.text);
				if(session.openchat !== obj.sender) {
					session.userlist[obj.sender].newmessages++;
				}
				$('#reciever').text = session.userlist[obj.sender].username
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
		console.log($(this).attr("id"));
		$('#userlist .collection .userlist-user').removeClass("active");
		$(this).addClass("active");
		
		session.openchat = $(this).attr("id");
		updateLog();
		console.log("chat="+session.userlist[session.openchat].chat);
		session.userlist[session.openchat].newmessages = 0;
	});
});

function login() {
	session.username = $('#username-form').val() ? $('#username-form').val() : "User";
	$('#username').text(session.username);

	//TODO generate pub key
	session.pubkey = "";
	session.privkey = "";

	var message = '{"command": "ANN", "message":{"id": '+session.userid+', "username":"'+session.username+'","pubkey":"'+session.pubkey+'"}}';
	send(message);
}