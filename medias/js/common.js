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
			displayError(titleErrorPageNotUpToDate, errorPageNotUpToDate);
        }
    },
	error: function(XMLHttpRequest, textStatus, errorThrown) { displayError(titleErrorHappened, errorHappened); },
	});
}

function updateCategoriesOrderInDb() {
	// Update categories_order in db
	var categories = $("table.category_workflow").find("td.take_untake_group");
	var categoriesOrder = "";
	for (var i = 0 ; i < categories.length ; i++) {
		var ID = $(categories[i]).attr("id").split('-')[1];
		categoriesOrder += ID;
		if (i + 1 != categories.length) {
			categoriesOrder += ", ";
		}
	}
	var workflowinstance_id = $("div.categories_table_workflow").attr("id").split('-')[1] + '/';
	$.ajax({
	url: "/workflow/set_categories_order/" + workflowinstance_id,
	type: "POST",
	data: {"categories_id" : categoriesOrder},
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) {
		if (data["status"] == "KO") {
			displayError(titleErrorHappened, errorHappened);
		}
	},
	error: function(XMLHttpRequest, textStatus, errorThrown) { displayError(titleErrorHappened, errorHappened); }
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
		var link = "/workflow/changedetails/" + itemID + '/';
	} else {
		var link = "/workflow/addcomment/" + itemID + '/';
	}
    $.ajax({
	url: link,
	type: "POST",
	data: $(el).serialize(),
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) {
		_show_item_detail("/workflow/item/show/" + itemID + '/', $(el).parents("tr"));
		if (what == 'detail') {
			_show_detail(el);
		} else {
			$(el).find("textarea").attr('value', '');
		}
	},
	error: function(XMLHttpRequest, textStatus, errorThrown) { displayError(titleErrorHappened, errorHappened); },
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

function intervalAjaxCall() {
	if (requestIntervalAjaxCall) {
		requestIntervalAjaxCall.abort();
	}
	var instanceID = $("div.categories_table_workflow").attr("id").split('-')[1];
	requestIntervalAjaxCall = $.ajax({
	url: "/workflow/getall/" + instanceID + '/',
	type: "POST",
	dataType: "json",
	timeout: 3000,
	success: function(data, textStatus, jqXHR) { _update_page(data); },
	error: function(XMLHttpRequest, textStatus, errorThrown) {}
	});
setTimeout("intervalAjaxCall()", 45000);
}

function _update_page(resp) {
	for (var i = 0 ; i < resp["allItems"].length ; i++) {
		var takeCell = $("td#take-item-" + resp["allItems"][i]["id"]);
		var untakeCell = $("td#untake-item-" + resp["allItems"][i]["id"]);
		var stateCell = $("td#action-shortcuts-" + resp["allItems"][i]["id"]);
		var stateItem = $(stateCell).attr("class").split(' ')[0].split('-')[2];
		if (takeCell.length) {
			var ownerItem = $(takeCell).attr("class").split(' ')[1].split('-')[1];
		} else {
			var ownerItem = $(untakeCell).attr("class").split(' ')[1].split('-')[1];
		}
		resp["allItems"][i]["state"] = (resp["allItems"][i]["state"] == "None") ? ("None") : ((resp["allItems"][i]["state"] == 1) ? ("OK") : ("KO"))
		if (resp["allItems"][i]["state"] != stateItem) {
			var link = "/workflow/item/";
			link += (resp["allItems"][i]["state"] == "None") ? ("no_state/") : ("validate/");
			link += resp["allItems"][i]["id"];
			link += (resp["allItems"][i]["state"] == "None") ? ("") : ((resp["allItems"][i]["state"] == 1) ? ("/OK/") : ("/KO/"));
			var el = $("td#action-shortcuts-" + resp["allItems"][i]["id"]).find("a.shortcut-disabled-" + resp["allItems"][i]["state"]);
			_update_item_shortcut(resp["allItems"][i], link, el);
		}
		if (resp["allItems"][i]["person"] != ownerItem) {
			resp["allItems"][i]["item_id"] = resp["allItems"][i]["id"];
			resp["allItems"][i]["assigned_to"] = resp["allItems"][i]["person"];
			resp["allItems"][i]["assigned_to_lastname"] = resp["allItems"][i]["person_lastname"];
			resp["allItems"][i]["assigned_to_firstname"] = resp["allItems"][i]["person_firstname"];
			var link = "/workflow/item/";
			var el = $("td#untake-item-" + resp["allItems"][i]["id"]);
			if (!(el.length)) {
				el = $("td#take-item-" + resp["allItems"][i]["id"]);
			}
			if (resp["allItems"][i]["person"] == "None") {
				link += "untake/" + resp["allItems"][i]["id"] + '/';
				_update_item_reset_owner(resp["allItems"][i], link, el);
			} else {
				link += "take/" + resp["allItems"][i]["id"] + '/';
				_update_item_add_owner(resp["allItems"][i], link, el);
			}
		}
	}
}

function categoryNumerotation() {
	var categoriesTitle = $("table.category_workflow").find("th");
	for (var i = 0 ; i < categoriesTitle.length ; i++ ) {
		var title = $(categoriesTitle[i]).html();
		$(categoriesTitle[i]).html(i + 1 + " - "  + title.split('-')[1]);
	}
}

var update_statistics_filters = function update_statistics_filters() {
    $("input[type=radio]#filters-all + span").html(" All items (" + gl_total + ")");
    $("input[type=radio]#filters-mine + span").html(" My items (" + gl_mine + ")");
    $("input[type=radio]#filters-untaken + span").html(" Untaken (" + gl_untaken + ")");
    $("input[type=radio]#filters-taken + span").html(" Taken (" + gl_taken + ")");
    $("input[type=radio]#filters-successful + span").html(" Successful items (" + gl_success + ")");
    $("input[type=radio]#filters-failed + span").html(" Broken items (" + gl_failed + ")");

    $("#filters-" + location.pathname.split('/')[4]).attr("checked", "checked").parent().attr("style", "font-weight: bold;");
	if (location.pathname.split('/')[4] != "all") {
		$("div#sortable").removeAttr("id");
	} else {
		$("div#sortable").attr("id", "sortable");
	}
}

function update_statistics_progressbar() {
    $("span#stats-success").parent().html("<span id='stats-success'></span> Success: " + gl_success);
    $("span#stats-failed").parent().html("<span id='stats-failed'></span> Failed Miserably: " + gl_failed);
    $("span#stats-unsolved").parent().html("<span id='stats-unsolved'></span> Untested: " + gl_not_solved);
}

function displayError(title, errorMessage) {
$("div#dialogError").attr("style", "visibility: visible;");
$("div#dialogError").attr("title", title);
$("div#dialogError p").html(errorMessage);
$("div#dialogError").dialog({
	modal	: true,
	buttons	: {
		Ok	: function() {
			intervalAjaxCall();
			$("div#dialogError").attr("style", "visibility: hidden;");
			$(this).dialog("close");
		}
	}
});
}

// Error messages
var errorHappened = "An error unexpectedly happened. Would you like to update the page ?";
var errorPageNotUpToDate = "Your workflow is not up to date. Would you like to update the page ?";

// Title box
var titleErrorPageNotUpToDate = "Page not up to date.";
var titleErrorHappened = "Error unexpectedly happened.";

// URLs
var checkBaseURL = "/workflow/check/";
