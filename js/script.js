var RRHelpers = {
	generateToken: function() {
		var chars = "123456789ABCDEFGHJKLMNPQRSTUVWXTZ";
		var string_length = 10;
		var randomstring = "";
		for (var i = 0; i < string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum, rnum + 1);
		}
		return randomstring.toLowerCase();
	}
}

var RR = {
	lipsum: "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.",
	
	me: {
		id: RRHelpers.generateToken(),
		template: "Stately",
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
			RR.setState();
			RR.setTemplate(RR.me.template);
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
	
	makeSortable: function() {
		$("#resume").sortable({
			axis: "y",
			items: ".section",
			handle: ".drag_section",
			placeholder: "ui-state-highlight",
			start: function(e, ui) {
	      ui.placeholder.height( ui.item.height() - 2 );
				ui.placeholder.css("margin-top", ui.item.css("margin-top"));
				ui.placeholder.css("margin-bottom", ui.item.css("margin-bottom"));
	    }
		});
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
		RR.addSection({ type: "introduction" }, false);
		RR.addSection({ type: "text", title: "Professional Summary" }, false);
		RR.addSection({ type: "text", title: "Skills" }, false);
		RR.addSection({ type: "experience", title: "Experience" }, false);
		RR.addSection({ type: "education", title: "Education" }, false);
		RR.addSection({ type: "text", title: "Certifications" }, false);
		RR.addSection({ type: "text", title: "References" }, false);
	},
	
	addSection: function(data, id) {
		RR.me.resume["sections"] = RR.me.resume.sections || {};
		var create = false;
		var clone = $("<div />").append(
			$("#section_templates").find(".section[data-type='" + data.type + "']").clone()
		);
				
		if (!id) {
			var id = RRHelpers.generateToken();
			create = true;
		}
		
		data.id = id;
		clone.find(".section").attr("data-id", data.id);
		$($(".section_meta").html()).prependTo(clone.find(".section"));
		var html = clone.html();
		
		if (data.type == "text") {
			data.title = data.title || "Professional Summary";
			data.content = data.content || RR.lipsum;
		} else if (data.type == "objective") {
			data.title = data.title || "Objective";
			data.content = data.content || RR.lipsum;
		} else if (data.type == "paragraph" || data.type == "introduction" || data.type == "conclusion") {
			data.content = data.content || RR.lipsum;
		} else if (data.type == "experience") {
			data.title = data.title || "Experience";
			data.content = data.content || "2004";
		} else if (data.type == "education") {
			data.title = data.title || "Education";
			data.content = data.content || "2005";
		}
		
		if (create) {
			RR.me.resume["sections"][id] = data;
			RR.db.child("resume").child("sections").child(id).set(data);
		}
		
		var output = Mustache.render(html, data);
		$(output).appendTo("#resume .sections");
		RR.makeSortable();
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
		
		if ($.isEmptyObject(RR.me.resume.sections)) {
			RR.addDefaultSections();
		} else {
			$.each(RR.me.resume.sections, function(id, data) {
				RR.addSection(data, id);
			});
		}
		
		RR.db.child("template").set(template);
		$("#resume [data-field]").attr("contenteditable", true);
		$("#templates .selected_template").removeClass("selected_template");
		$("#templates img[data-template='" + template + "']").addClass("selected_template");
		$("#current_template_name").text(template)
	}
};

$(function() {
	$(document).on("ready", function() {
		RR.connect();
		$(".template_count").text( $("#templates img").length );
		if (typeof $.cookie("try_next_template") != "undefined") {
			$(".try_next_template").hide();
		}

		RR.makeSortable();
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

	$(document).on("click", ".add_section", function() {
		var data = { type: $(this).data("type") };
		RR.addSection(data, false);
		$("#resume [data-field]").attr("contenteditable", true);
		return false;
	});

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
});