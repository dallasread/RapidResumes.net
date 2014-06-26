var RRHelpers = {
	generateToken: function() {
		var chars = "123456789ABCDEFGHJKLMNPQRSTUVWXTZ";
		var string_length = 10;
		var randomstring = "";
		for (var i = 0; i < string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum, rnum + 1);
		}
		return randomstring;
	}
}

var RR = {
	lipsum: "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful.",
	
	me: {
		id: RRHelpers.generateToken(),
		template: "stately",
		resume: {
			name: "Your Name",
			address: "123 Your Address",
			city: "Super City",
			state: "Wyoming",
			country: "United States",
			zipcode: "12345",
			phone: "1 (906) 937-3473",
			email: "job-winning@rapidresumes.net",
			sections: {}
		}
	},
	
	db: false,
	
	connect: function() {
		if (window.location.hash.length && window.location.hash != "") {
			var id = window.location.hash.split("/")[1];
			
			if (id == "new") {
				$.cookie("resume_id", RRHelpers.generateToken(), { expires: 99999, path: "/" });
				window.location.hash = "";
				RR.connect();
			} else {
				RR.db = new Firebase("https://rapidresumes.firebaseio.com/" + id);
				RR.db.once("value", function(data) {
					if (data.val() === null) {
						window.location.hash = "";
						window.location.reload();
					} else {
						RR.me = data.val();
						RR.setTemplate(RR.me.template);
						RR.setState();
					}
				});
			}			
		} else if (typeof $.cookie("resume_id") === "undefined") {
			$.cookie("resume_id", RR.me.id, { expires: 99999, path: "/" });
			RR.db = new Firebase("https://rapidresumes.firebaseio.com/" + RR.me.id);
			RR.db.set(RR.me);
			RR.setTemplate(RR.me.template);
			RR.setState();
		} else {
			RR.db = new Firebase("https://rapidresumes.firebaseio.com/" + $.cookie("resume_id"));
			RR.db.once("value", function(data) {
				if (data.val() === null) {
					RR.db = null;
					$.removeCookie("resume_id", { path: "/" });
					RR.connect();
				} else {
					RR.me = data.val();
					RR.setTemplate(RR.me.template);
					RR.setState();
				}
			});
		}
		
		return true;
	},
	
	markAsPaid: function() {
		$("[data-step='3']").hide();
		$(".step.selected, .show_step.selected").removeClass("selected");
		$("[data-step='4']").removeClass("hide").addClass("selected");
		$(".hide_on_paid").hide()
	},
	
	markAsInProgress: function() {
		$(".step.selected, .show_step.selected").removeClass("selected");
		$("[data-step='2']").addClass("selected");
	},
	
	setState: function() {
		if (RR.me.paid || window.location.hash.indexOf("paid") != -1) {
			RR.markAsPaid();
			window.location.hash = "!/" + RR.me.id + "/paid"
		} else if (window.location.hash.length) { 
			RR.markAsInProgress();
			window.location.hash = "!/" + RR.me.id
		} else {
			window.location.hash = "!/" + RR.me.id
		}

		$("#nav .steps").fadeIn()
		$(".main_loading").fadeOut();
	},
	
	setStep: function(step) {
		var current = $("#nav .show_step.selected");
		var current_step = parseInt(current.data("step"));
		
		if (current_step != step) {
			$("[data-step!='" + step + "']").removeClass("selected");
			$("[data-step='" + step + "']").addClass("selected");
			
			if (step == 3) {
				var href = $(".resume_link").data("href") + RR.me.id;
				$("#resume_id").val( RR.me.id );
				$(".resume_link").text(href).attr("href", href);
			}
		}
	},
	
	addDefaultSections: function() {
		RR.addSection({
			type: "text",
			title: "Professional Summary"
		}, false);
		
		RR.addSection({
			type: "text",
			title: "Objective"
		}, false);
		
		RR.addSection({
			type: "text",
			title: "Skills"
		}, false);
		
		RR.addSection({
			type: "timeline",
			title: "Experience"
		}, false);
		
		RR.addSection({
			type: "timeline",
			title: "Education"
		}, false);
		
		RR.addSection({
			type: "timeline",
			title: "Certifications"
		}, false);
		
		RR.addSection({
			type: "text",
			title: "References"
		}, false);
	},
	
	addSection: function(data, id) {
		if (!id) {
			var id = RRHelpers.generateToken();
			var create = true;
		}
		
		var clone = $($("#section_" + data.type + "_template").html());

		if (data.type == "text") {
			data.title = data.title || "Professional Summary";
			data.content = data.content || RR.lipsum;
			clone.find("[data-field='title']").text(data.title);
			clone.find("[data-field='content']").text(data.content);
		} else if (data.type == "paragraph") {
			data.content = data.content || RR.lipsum;
			clone.find("[data-field='content']").text(data.content);
		} else if (data.type == "list") {
			data.title = data.title || "Skills";
			data.content = data.content || "- One";
			clone.find("[data-field='title']").text(data.title);
			clone.find("[data-field='content']").text(data.content);
		} else if (data.type == "timeline") {
			data.title = data.title || "Experience";
			data.content = data.content || "2004";
			clone.find("[data-field='title']").text(data.title);
			clone.find("[data-field='content']").text(data.content);
		}
		
		clone.data("id", id);
		clone.appendTo("#resume .sections");
		
		if (create) {
			RR.me.resume["sections"] = RR.me.resume.sections || {};
			RR.me.resume["sections"][id] = data;
			RR.db.child("resume").child("sections").child(id).set(data);
		}
	},
	
	setTemplate: function(template) {
		var field = null;
		var resume = $("#resume_template");
		var fields = ["name", "address", "city", "state", "country", "zipcode", "email", "phone"];
		$("#resume").attr("class", "box " + template.toLowerCase()).html( resume.html() );
		$("html, body").scrollTop(0);
		
		for (var i = 0; i < fields.length; i++) {
		  field = fields[i];
			$("[data-field='" + field + "']").text( RR.me.resume[field] );
		}
		
		if ($.isEmptyObject(RR.me.resume.sections)) { RR.addDefaultSections(); }
		
		$.each(RR.me.resume.sections, function(id, data) {
			RR.addSection(data, id);
		});
		
		RR.db.child("template").set(template);
		$("#resume [data-field]").attr("contenteditable", true);
		$("#templates .selected_template").removeClass("selected_template");
		$("#templates img[data-template='" + template + "']").addClass("selected_template");
		$("#current_template_name").text(template)
	}
};

$(document).on("ready", function() {
	RR.connect();
	$(".template_count").text( $("#templates img").length );
	if (typeof $.cookie("try_next_template") != "undefined") {
		$(".try_next_template").hide();
	}
	
	// $("#resume").sortable({
	// 	axis: "y",
	// 	items: ".section"
	// })
});

$(document).on("click", ".show_step", function() {
	RR.setStep( $(this).data("step") );
	return false;
});

$(document).on("click", "[data-template]", function() {
	RR.setTemplate( $(this).data("template") );
	return false;
});

$(document).on("blur", "[data-field]", function() {
	var section = $(this).closest(".section");
	var field = $(this).data("field");
	var value = $(this).text();
	
	if (section.length) {
		var type = section.data("type");
		var id = section.data("id");
		if (typeof id === "undefined") { id = RRHelpers.generateToken(); section.data("id", id); }
		RR.me.resume["sections"][id][field] = value;
		RR.db.child("resume").child("sections").child(id).child(field).set(value);
	} else {
		RR.me.resume[field] = value;
		RR.db.child("resume").child(field).set(value);
	}
	return false;
});

$(document).on("click", "[data-direction]", function() {
	var index = $("#templates .selected_template").closest("li").index();
	var new_index = 0;
	var last_index = $("#templates img").length - 1;
	var direction = $(this).data("direction");
	
	if (direction == "next") {
		if (index + 1 <= last_index) {
			new_index = index + 1;
		}
	} else if (direction == "prev") {
		if (index - 1 < 0) {
			new_index = last_index;
		} else {
			new_index = index - 1;
		}
	}
	
	$.cookie("try_next_template", "true", { expires: 99999, path: "/" });
	$(".try_next_template").fadeOut();
	
	RR.setTemplate( $("#templates li:eq(" + new_index + ") img").data("template") );
	
	return false;
});

$(document).on("mouseenter", "#resume .remove_section", function() {
	$(this).closest(".section").addClass("highlight");
});

$(document).on("mouseleave", "#resume .remove_section", function() {
	$(this).closest(".section").removeClass("highlight");
});

$(document).on("keypress", "#resume [contenteditable]", function(e) {
	var keycode = (e.keyCode ? e.keyCode : e.which);
	if (keycode == "13") { $(this).trigger("blur"); return false; }
});

$(document).on("click", "#resume .remove_section", function() {
	var section = $(this).closest(".section");
	section.addClass("highlight");
	
	if (confirm("Are you sure you want to remove this section?")) {
		delete RR.me.resume["sections"][section.data("id")]
		RR.db.child("resume").child("sections").child(section.data("id")).remove();
		section.remove();
	}
	
	section.removeClass("highlight");
});

$(document).on("click", "#resume .add_section", function() {
	var data = { type: $(this).data("type") };
	RR.addSection(data, false);
	$("#resume [data-field]").attr("contenteditable", true);
	return false;
});