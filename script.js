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
});