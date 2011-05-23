/* Compute failed/success/not_solved/mine item total */

function compute_total_items_state() {
    gl_not_solved = $("div.categories_table_workflow td.state-item-None").length;
    gl_success = $("div.categories_table_workflow td.state-item-OK").length;
    gl_failed = $("div.categories_table_workflow td.state-item-KO").length;
    gl_total = gl_success + gl_failed + gl_not_solved;
    update_statistics_progressbar();
    $("#progress_bar").html(progressbar);
    gl_total = gl_taken + gl_untaken;
    update_statistics_filters();
}

/* ***************** */

/* Compute taken/untaken item total */

function compute_taken_untaken_items() {
    var untaken_item_cel = $("div.categories_table_workflow").find(".category_workflow td.take-item");
    var taken_item_cel = $("div.categories_table_workflow").find(".category_workflow td.untake-item");
    gl_taken = taken_item_cel.length;
    gl_untaken = untaken_item_cel.length;
    update_statistics_filters();
}

/* ***************** */

/* Update actions shortcut items */

function  _update_item_shortcut(data, link, el) {
    link = link.split('/');
    if ($(el).hasClass("shortcut-disabled-None")) {
	link[link.length - 1] = "OK/";
	var ok_shortcut = "<a class='shortcut-disabled-OK shortcut' href='' onclick='return false;'";
	ok_shortcut += " title='Click to validate'><img src='/medias/workflow/img/validation_OK_disabled.png'/></a>";
	var no_state_shortcut = "<a title='Item is untested'> ? </a>";
	link[link.length - 1] = "KO/";
	var ko_shortcut = "<a class='shortcut-disabled-KO shortcut' href='' onclick='return false;'";
	ko_shortcut += "' title='Click to mark as broken'><img src='/medias/workflow/img/validation_KO_disabled.png'/></a>";
	$(el).parent().attr("class", "state-item-None shortcut-cell");
    } else {
	if ($(el).hasClass("shortcut-disabled-KO")) {
		link[link.length - 2] = "OK";
		var ok_shortcut = "<a class='shortcut-disabled-OK shortcut' href='' onclick='return false;'";
		ok_shortcut += "' title='Click to validate'><img src='/medias/workflow/img/validation_OK_disabled.png'/></a>";
		var ko_shortcut = "<a class='shortcut-enabled-KO' title='Item is broken' href='' onclick='return false;'>";
		ko_shortcut += "<img src='/medias/workflow/img/validation_KO.png'/></a>";
		$(el).parent().attr("class", "state-item-KO shortcut-cell");
	} else {
		link[link.length - 2] = "KO";
		var ko_shortcut = "<a class='shortcut-disabled-KO shortcut' href='' onclick='return false;'";
		ko_shortcut += "' title='Click to mark as broken'><img src='/medias/workflow/img/validation_KO_disabled.png'/></a>";
		var ok_shortcut = "<a class='shortcut-enabled-KO shortcut' title='Item is validated' href='' onclick='return false;'>";
		ok_shortcut += "<img src='/medias/workflow/img/validation_OK.png'/></a>";
		$(el).parent().attr("class", "state-item-OK shortcut-cell");
	}
	link[link.length - 2] = '';
	link[link.length - 1] = '';
	var no_state_shortcut = "<a class='shortcut-disabled-None shortcut' href='' onclick='return false;'";
	no_state_shortcut += "' title='Reset item validation'> ? </a>";
    }
	$(el).parent().attr('title', "State item was updated by " + data["person_lastname"] + " " + data["person_firstname"]);
	$(el).parent().html(ok_shortcut + no_state_shortcut + ko_shortcut);
	compute_total_items_state();
}

/* ***************** */

/* Show detail of one item */

function _display_one_comment(comment, iterator) {
	var blockComment = "<div class='one_comment'>";
	blockComment += "<h3><span id='ancre_comment'><a name='" + iterator + "'"
	blockComment += " href='#" + iterator + "' title='Comment anchor - " + iterator + "'>";
	blockComment += "#" + iterator + "</a></span> - " + comment["date"] + " - " + comment["person_firstname"] + " " + comment["person_lastname"].toUpperCase() + "</h3>";
	blockComment += "<pre>" + comment["comment"] + "</pre>";
	blockComment += "</div>";
	return blockComment;
}

function _display_item_detailAndComment(resp, el) {
	if (resp["detail"].length) {
		$(el).find("pre.details_item").html(resp["detail"]);
	} else {
		$(el).find("pre.details_item").html("** No details **");
	}
	if (resp["comments"].length) {
		$(el).find("pre.comments_item").html(_display_one_comment(resp["comments"][0], 0));
		for (var i = 1; i < resp["comments"].length ; i++) {
			$(el).find("pre.comments_item").append(_display_one_comment(resp["comments"][i], i));
		}
	} else {
		$(el).find("pre.comments_item").html("** No comments **");
	}
}

function _show_item_detail(link, el) {
    $.ajax({
	url: link,
	type: "POST",
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) { _display_item_detailAndComment(data, el); },
	error: function(XMLHttpRequest, textStatus, errorThrown) { alert(error_message); }
	});
}

/* ***************** */

/* Take one item */

function _update_item_add_owner(data, link, el) {
    var content = data["assigned_to_firstname"] + " " + data["assigned_to_lastname"].toUpperCase();
    content += " <a title='Untake item' href='' onclick='return false;'><img src='/medias/workflow/img/untake.png' /></a>";
    $(el).attr("class", "untake-item owner-" + data["assigned_to"]).html(content);
    $(el).attr("id", "untake-item-" + data["item_id"]);
    compute_taken_untaken_items();
}

/* ***************** */

/* Untake one item */

function _update_item_reset_owner(data, link, el) {
    var content = "<a title='Take item' href='' onclick='return false;'>take</a>";
    $(el).attr("class", "take-item owner-None").html(content);
    $(el).attr("id", "take-item-" + data["item_id"]);
    compute_taken_untaken_items();
}

/* ***************** */

/* Untake a whole group */

function _update_whole_group_reset_owner(data) {
    var element_to_add = $("table#category_id-" + data["category_id"] + " td.untake-item");
      for (var i = 0; i < element_to_add.length ; i++) {
        if ($(element_to_add[i]).attr("class").split(' ')[1].split('-')[1] == data["person_id"]) {
            data["item_id"] = $(element_to_add[i]).attr("id").split('-')[2];
            _update_item_reset_owner(data, null, element_to_add[i]);
        }
    }
}

/* ***************** */

/* Take a whole group */

function _update_whole_group_add_owner(data) {
    var element_to_add = $("table#category_id-" + data["category_id"] + " td.take-item");
      for (var i = 0; i < element_to_add.length ; i++) {
	  data["item_id"] = $(element_to_add[i]).attr("id").split('-')[2];
	  _update_item_add_owner(data, null, element_to_add[i]);
    }
}

/* ***************** */
var error_message = "Errors unexpectedly happened. Please refresh the page.";
var checkBaseURL = "/workflow/workflowinstance/check/";
