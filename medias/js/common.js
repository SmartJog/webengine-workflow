function _check_if_has_changed(data, el, toCheck) {
    if (toCheck == 1) {
        var itemOwner = $(el).attr("class").split(' ')[1].split('-')[1];
        return itemOwner == data.assigned_to;
    } else if (toCheck == 0) {
        var itemState = $(el).attr("class").split(' ')[0].split('-')[2];
        return itemState == data.validation;
    } else if (toCheck == 2) {
        elementsToCheck = $(el).find("td.take-item, td.untake-item");
        for (i = 0; i < elementsToCheck.length; i++) {
            var elToCheckOwnerID = $(elementsToCheck[i]).attr("class").split(' ')[1].split('-')[1];
            var elToCheckID = $(elementsToCheck[i]).attr("id").split('-')[2];
            if (data.owners_id[elToCheckID] != elToCheckOwnerID) {
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
    var link = null;
    if (toCheck != 2) {
        link = checkBaseURL + model.id + "/0/";
    } else {
        link = checkBaseURL + "0/" + model.id + '/';
    }
    $.ajax({
        url: link,
        type: "POST",
        dataType: "json",
        timeout: 3000,
        success: function (data) {
            if (_check_if_has_changed(data, elParent, toCheck)) {
                model.fetch({
                    success : model.attributes.ajaxCallback.success,
                    error   : model.attributes.ajaxCallback.error
                });
            } else {
                displayError(titleErrorPageNotUpToDate, errorPageNotUpToDate);
            }
        },
        error: function () { displayError(titleErrorHappened, errorHappened); }
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

function _show_detail(el) {
    $(el).parent().attr('style', 'display: none;');
    $(el).parent().prev().attr('style', 'display: block;');
    $(el).parent().prev().prev().attr('style', 'display: block;');
}

function changeDetailsOrAddComment(what, el) {
    var itemID = $(el).parents("tr").attr("id").split('-')[2];
    var link = null;
    if (what == "detail") {
        link = "/workflow/changedetails/" + itemID + '/';
    } else {
        link = "/workflow/addcomment/" + itemID + '/';
    }
    $.ajax({
        url: link,
        type: "POST",
        data: $(el).serialize(),
        dataType: "json",
        timeout: 3000,
        success: function () {
         _show_item_detail("/workflow/item/show/" + itemID + '/', $(el).parents("tr"));
         if (what == 'detail') {
            _show_detail(el);
         } else {
            $(el).find("textarea").attr('value', '');
         }
      },
      error: function () { displayError(titleErrorHappened, errorHappened); }
   });
}

function edit_details(el) {
    $(el).attr('style', 'display: none;');
    $(el).next().attr('style', 'display: none;');
    $(el).next().next().attr('style', 'display: block;');
    $(el).next().next().find("textarea").attr('value', $(el).html());
}

function _update_page(resp) {
    for (i = 0; i < resp.allItems.length; i++) {
        var takeCell = $("td#take-item-" + resp.allItems[i].id);
        var untakeCell = $("td#untake-item-" + resp.allItems[i].id);
        var stateCell = $("td#action-shortcuts-" + resp.allItems[i].id);
        var stateItem = $(stateCell).attr("class").split(' ')[0].split('-')[2];
      var ownerItem = null;
        if (takeCell.length) {
            ownerItem = $(takeCell).attr("class").split(' ')[1].split('-')[1];
        } else {
            ownerItem = $(untakeCell).attr("class").split(' ')[1].split('-')[1];
        }
        resp.allItems[i].state = (resp.allItems[i].state == "None") ? ("None") : ((resp.allItems[i].state == 1) ? ("OK") : ("KO"));
        if (resp.allItems[i].state != stateItem) {
            var link = "/workflow/item/";
            link += (resp.allItems[i].state == "None") ? ("no_state/") : ("validate/");
            link += resp.allItems[i].id;
            link += (resp.allItems[i].state == "None") ? ("") : ((resp.allItems[i].state == 1) ? ("/OK/") : ("/KO/"));
            var el = $("td#action-shortcuts-" + resp.allItems[i].id).find("a.shortcut-disabled-" + resp.allItems[i].state);
            _update_item_shortcut(resp.allItems[i], link, el);
        }
        if (resp.allItems[i].person != ownerItem) {
            resp.allItems[i].item_id = resp.allItems[i].id;
            resp.allItems[i].assigned_to = resp.allItems[i].person;
            resp.allItems[i].assigned_to_lastname = resp.allItems[i].person_lastname;
            resp.allItems[i].assigned_to_firstname = resp.allItems[i].person_firstname;
            var linkItem = "/workflow/item/";
            var elItem = $("td#untake-item-" + resp.allItems[i].id);
            if (!(elItem.length)) {
                elItem = $("td#take-item-" + resp.allItems[i].id);
            }
            if (resp.allItems[i].person == "None") {
                linkItem += "untake/" + resp.allItems[i].id + '/';
                _update_item_reset_owner(resp.allItems[i], linkItem, elItem);
            } else {
                linkItem += "take/" + resp.allItems[i].id + '/';
                _update_item_add_owner(resp.allItems[i], linkItem, elItem);
            }
        }
    }
}

function categoryNumerotation() {
    var categoriesTitle = $("table.category_workflow").find("th");
    for (i = 0; i < categoriesTitle.length; i++) {
        var title = $(categoriesTitle[i]).html();
        $(categoriesTitle[i]).html(i + 1 + " - "  + title.split('-')[1]);
    }
}

function update_statistics_filters() {
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
        success: function (data) { _update_page(data); },
        error: function () {}
    });
   setTimeout("intervalAjaxCall()", 45000);
}
