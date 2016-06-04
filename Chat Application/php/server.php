<?php
// prevent the server from timing out
set_time_limit(0);

// include the web sockets server script (the server is started at the far bottom of this file)
require 'class.PHPWebSocket.php';

$encryptStatus = 0;
$users = array();
$presClient = 0;

// when a client sends data to the server
function wsOnMessage($clientID, $message, $messageLength, $binary) {
	global $Server, $encryptStatus, $presClient, $users;
	$ip = long2ip( $Server->wsClients[$clientID][6] );

	// check if message length is 0
	if ($messageLength == 0) {
		$Server->wsClose($clientID);
		return;
	}

	$object = json_decode($message);
	if($object->command == "ANN") {
		if($object->message->username == "BroodjeKaasPresentatie") {
			$presClient = $clientID;
		} else {
			$newuser = array(
				'id' => $object->message->id, 
				'username' => $object->message->username,
			);
			$users[$clientID] = $newuser;
			//array_push($users, $newuser);
			foreach ( $Server->wsClients as $id => $client ) {
				if ( $id != $clientID) {
					$Server->wsSend($id, $message);
				}
			}
		}
		
	} elseif($object->command == "LOCK") {
		$encryptStatus = $object->message->encryptStatus;
		
		$Server->log( "Encryption set to: ".$encryptStatus);

		foreach ( $Server->wsClients as $id => $client ) {
			if ( $id != $clientID ) {
				$Server->wsSend($id, $message);
			}
		}

	} elseif($object->command == "MSG") {
		$Server->wsSend($object->reciever, $message);
		$Server->wsSend($presClient, $message);
	}
	$Server->log( $message );
}

// when a client connects
function wsOnOpen($clientID)
{
	global $Server, $encryptStatus, $users;
	$ip = long2ip( $Server->wsClients[$clientID][6] );

	$Server->log( "$ip ($clientID) has connected." );

	$msg = array(
		'id' => $clientID, 
		'encryptStatus' => $encryptStatus,
		'userList' => $users
	);

	$arr = array(
		'command' => "HELO", 
		'message' => $msg
	);

	$string = json_encode($arr);
	$Server->wsSend($clientID, $string);
}

// when a client closes or lost connection
function wsOnClose($clientID, $status) {
	global $Server, $users;
	$ip = long2ip( $Server->wsClients[$clientID][6] );

	$Server->log( "$ip ($clientID) has disconnected." );

	unset($users[$clientID]);

	$msg = array(
		'id' => $clientID
	);

	$arr = array(
		'command' => "QUIT", 
		'message' => $msg
	);

	$string = json_encode($arr);
	//Send a user left notice to everyone in the room
	foreach ( $Server->wsClients as $id => $client )
		$Server->wsSend($id, $string);
}

// start the server
$Server = new PHPWebSocket();
$Server->bind('message', 'wsOnMessage');
$Server->bind('open', 'wsOnOpen');
$Server->bind('close', 'wsOnClose');
// for other computers to connect, you will probably need to change this to your LAN IP or external IP,
// alternatively use: gethostbyaddr(gethostbyname($_SERVER['SERVER_NAME']))
$Server->wsStartServer('0.0.0.0', 9300);

?>