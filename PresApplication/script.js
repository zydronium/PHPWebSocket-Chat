$(document).ready(function () {

	$("#homePage").click(function (event){
		$("#homePage").hide();
		$("#index").show();
	});

	$("#index").click(function (event){
		$("#index").hide();
		$("#what").show();
	});

	$("#what").click(function (event){
		$("#what").hide();
		$("#demo1").show();
	});

	$("#demo1").click(function (event){
		$("#demo1").hide();
		$("#security").show();
	});

	$("#security").click(function (event){
		$("#security").hide();
		$("#end").show();
        Server.send( "message", '{"command":"LOCK","message":{"encryptStatus": 1}}' );        
	});

	$("#end").click(function (event){
		$("#end").hide();
		$("#demo2").show();
	});

	$("#demo2").click(function (event){
		$("#demo2").hide();
		$("#daily").show();
	})

	$("#daily").click(function (event){
		$("#daily").hide();
		$("#question").show();
	})
    
	Server = new FancyWebSocket('ws://chat.123apps.net:9300');
    
	//Log any messages sent from server
	Server.bind('message', function( payload ) {
        var obj = JSON.parse(payload);
        if(obj.command == "HELO") {
            Server.send( "message", '{"command": "ANN", "message":{"id": '+obj.message.id+', "username":"BroodjeKaasPresentatie","pubkey":""}}' );
            Server.send( "message", '{"command":"LOCK","message":{"encryptStatus": 0}}' );
        }else if(obj.command == "MSG") {
            var message = "Reciever: "+obj.sender+" - Reciever: "+obj.reciever+" - Message: "+obj.message.text;
            $(".demoGroup").html = "<li>" + message + "</li>" + $(".demoGroup").html;
        }
	});

	Server.connect();
});