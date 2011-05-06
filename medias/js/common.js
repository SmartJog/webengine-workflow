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
    $("input[type=radio]#filters-all + span").remove();
    $("input[type=radio]#filters-all").parent().append("<span> All items (" + gl_total + ")</span>");
    $("input[type=radio]#filters-mine + span").remove();
    $("input[type=radio]#filters-mine").parent().append("<span> Mine items (" + gl_mine + ")</span>");
    $("input[type=radio]#filters-untaken + span").remove();
    $("input[type=radio]#filters-untaken").parent().append("<span> Untaken (" + gl_untaken + ")</span>");
    $("input[type=radio]#filters-taken + span").remove();
    $("input[type=radio]#filters-taken").parent().append("<span> Taken (" + gl_taken + ")</span>");
    $("input[type=radio]#filters-successful + span").remove();
    $("input[type=radio]#filters-successful").parent().append("<span> Successful items (" + gl_success + ")</span>");
    $("input[type=radio]#filters-failed + span").remove();
    $("input[type=radio]#filters-failed").parent().append("<span> Broken items (" + gl_failed + ")</span>");

    $("#filters-" + location.pathname.split('/')[5]).attr("checked", "checked").parent().attr("style", "font-weight: bold;");
}

function update_statistics_progressbar() {
    $("span#stats-success").parent().html("<span id='stats-success'></span> Success: " + gl_success);
    $("span#stats-failed").parent().html("<span id='stats-failed'></span> Failed Miserably: " + gl_failed);
    $("span#stats-unsolved").parent().html("<span id='stats-unsolved'></span> Untested: " + gl_not_solved);
}
