function _check_if_has_changed(el, data, link, callback) {
    if ($("td#take-item-" + data["item_id"]).html()) {
	var take_untake_cell_validation = $("td#take-item-" + data["item_id"]).attr("class").split(' ')[1].split('-')[1];
    } else {
	var take_untake_cell_validation = $("td#untake-item-" + data["item_id"]).attr("class").split(' ')[1].split('-')[1];
    }
    if ($("td#action-shortcuts-" + data["item_id"]).attr("class").split('-')[2] == data["validation"]
	   && take_untake_cell_validation == data["assigned_to"]) {
	$.ajax({
	url: link,
	type: "POST",
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) { callback(data, link, el); },
	error: function(XMLHttpRequest, textStatus, errorThrown) { alert(error_message); },
	});
    } else {
	confirm("Your current version is not up to date. Would you like to refresh the page ?") ? (location.reload()) : (_);
    }
}

function item_has_changed(el, link_callback, callback) {
    if ($(el).attr("id")) {
	var id = $(el).attr("id").split('-')[2];
    } else {
	var id = $(el).parent().attr("id").split(' ')[0].split('-')[2];
    }
    if ($(el).attr("id").indexOf("group") > 0) {
	var link = "/workflow/workflowinstance/check/0/" + id + "/";
    } else {
	var link = "/workflow/workflowinstance/check/" + id + "/0/";
    }
    $.ajax({
	url: link,
	type: "POST",
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) { _check_if_has_changed(el, data, link_callback, callback); },
	error: function(XMLHttpRequest, textStatus, errorThrown) { alert(error_message); },
	});
}

function edit_details() {
    $('div.details').attr('style', 'display: none;');
    $('div.add_details').attr('style', 'display: block;');
}

var update_statistics_filters = function update_statistics_filters() {
    $("input[type=radio]#filters-all + span").html(" All items (" + gl_total + ")");
    $("input[type=radio]#filters-mine + span").html(" Mine items (" + gl_mine + ")");
    $("input[type=radio]#filters-untaken + span").html(" Untaken (" + gl_untaken + ")");
    $("input[type=radio]#filters-taken + span").html(" Taken (" + gl_taken + ")");
    $("input[type=radio]#filters-successful + span").html(" Successful items (" + gl_success + ")");
    $("input[type=radio]#filters-failed + span").html(" Broken items (" + gl_failed + ")");

    $("#filters-" + location.pathname.split('/')[5]).attr("checked", "checked").parent().attr("style", "font-weight: bold;");
}

function update_statistics_progressbar() {
    $("span#stats-success").parent().html("<span id='stats-success'></span> Success: " + gl_success);
    $("span#stats-failed").parent().html("<span id='stats-failed'></span> Failed Miserably: " + gl_failed);
    $("span#stats-unsolved").parent().html("<span id='stats-unsolved'></span> Untested: " + gl_not_solved);
}
