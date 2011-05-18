function _check_if_has_changed(data, model, el, toCheck) {
    if (toCheck == 1) {
        var itemOwner = $(el).attr("class").split(' ')[1].split('-')[1];
        return itemOwner == data["assigned_to"];
    } else if (toCheck == 0) {
        var itemState = $(el).attr("class").split(' ')[0].split('-')[2];
        return itemState == data["validation"];
    } else if (toCheck == 2) {
        elementsToCheck = $(el).find("td.take-item, td.untake-item");
        for (var i = 0; i < elementsToCheck.length ; i++) {
            var elToCheckOwnerID = $(elementsToCheck[i]).attr("class").split(' ')[1].split('-')[1];
            var elToCheckID = $(elementsToCheck[i]).attr("id").split('-')[2];
            if (data["owners_id"][elToCheckID] != elToCheckOwnerID) {
                return false;
            }
        }
        return true;
    }
}

function _item_has_changed(model, elParent, toCheck) {
    // toCheck:
    // 0 will check for owner
    // 1 will check for state item
    // 2 will check for state of a whole group
    if (toCheck != 2) {
        var link = checkBaseURL + model.id + "/0/";
    } else {
        var link = checkBaseURL + "0/" + model.id + '/';
    }
    $.ajax({
	url: link,
	type: "POST",
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) {
        if (_check_if_has_changed(data, model, elParent, toCheck)) {
            model.fetch({
                success : model.attributes.ajaxCallback.success,
                error   : model.attributes.ajaxCallback.error
            });
        } else {
            confirm("Your workflow is not up to date. Would you like to refresh the page ?") ? (location.reload()) : (_);
        }
    },
	error: function(XMLHttpRequest, textStatus, errorThrown) { alert(error_message); },
	});
}

function _show_commentOrDetail(el, what) {
	if (what == 'detail') {
		$(el).parents("tr").find("div.all_for_detail").attr('style', 'display: block;');
		$(el).parents("tr").find("div.all_for_comment").attr('style', 'display: none;');
		$(el).html("<b>Details</b>");
		$(el).parents("tr").find("div.title_detail_item a:last-child").html("Comments");
	} else {
		$(el).parents("tr").find("div.all_for_comment").attr('style', 'display: block;');
		$(el).parents("tr").find("div.all_for_detail").attr('style', 'display: none;');
		$(el).html("<b>Comments</b>");
		$(el).parents("tr").find("div.title_detail_item a:first-child").html("Details");
	}
}

function changeDetailsOrAddComment(what, el) {
	var itemID = $(el).parents("tr").attr("id").split('-')[2];
	if (what == "detail") {
		var link = "/workflow/workflowinstance/changedetails/" + itemID + '/';
	} else {
		var link = "/workflow/workflowinstance/addcomment/" + itemID + '/';
	}
    $.ajax({
	url: link,
	type: "POST",
	data: $(el).serialize(),
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) {
		_show_item_detail("/workflow/workflowinstance/item/show/" + itemID + '/', $(el).parents("tr"));
		if (what == 'detail') {
			_show_detail(el);
		} else {
			$(el).find("textarea").attr('value', '');
		}
	},
	error: function(XMLHttpRequest, textStatus, errorThrown) { alert(error_message); },
	});
}

function _show_detail(el) {
	$(el).parent().attr('style', 'display: none;');
	$(el).parent().prev().attr('style', 'display: block;');
	$(el).parent().prev().prev().attr('style', 'display: block;');
}

function edit_details(el) {
    $(el).attr('style', 'display: none;');
    $(el).next().attr('style', 'display: none;');
    $(el).next().next().attr('style', 'display: block;');
    $(el).next().next().find("textarea").attr('value', $(el).html());
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
