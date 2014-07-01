$(document).on("click", "a[data-upsell]", function() {
	$("#upsell .no_button").attr("href", $(this).attr("href"));
	$("#upsell .yes_button").attr("href", $(this).data("upsell"));
	$("#upsell").fadeIn(111);
	return false;
});

$(document).on("click", "#upsell a", function() {
	$(".loading").show();
});

$(document).on("click", "#upsell", function(e) {
	if ($(e.target).attr("id") == "upsell") {
		$("#upsell").fadeOut(111);
		$(".loading").hide();
	}
});