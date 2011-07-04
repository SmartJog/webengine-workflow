/* Update one item line */
function _update_item_line(el, model) {
    // Update state of item contained in @el@
    _update_item_validation(model, $(el).find('td.validation-cell a.validation-disabled-' + model.get('state')));
    if (model.get('owner') != 'None') {
        // Add an owner to the item
        _update_item_add_owner(model, model.url(), $(el).find('td')[1]);
    } else {
        //Reset the owner of the item
        _update_item_reset_owner(model, model.url(), $(el).find('td')[1]);
    }
}

/* Update validation items */
function  _update_item_validation(data, el) {
    if ($(el).hasClass("validation-disabled-None")) {
        var ok_validation = "<a class='validation-disabled-OK validation' href='' onclick='return false;'";
        ok_validation += " title='Click to validate'><img src='/medias/workflow/img/validation_OK_disabled.png'/></a>";
        var no_state_validation = "<a title='Item is untested'><span> ? </span></a>";
        var ko_validation = "<a class='validation-disabled-KO validation' href='' onclick='return false;'";
        ko_validation += "' title='Click to mark as broken'><img src='/medias/workflow/img/validation_KO_disabled.png'/></a>";
        $(el).parent().attr("class", "state-item-None validation-cell");
    } else {
        if ($(el).hasClass("validation-disabled-KO")) {
            var ok_validation = "<a class='validation-disabled-OK validation' href='' onclick='return false;'";
            ok_validation += "' title='Click to validate'><img src='/medias/workflow/img/validation_OK_disabled.png'/></a>";
            var ko_validation = "<a class='validation-enabled-KO' title='Item is broken' href='' onclick='return false;'>";
            ko_validation += "<img src='/medias/workflow/img/validation_KO.png'/></a>";
            $(el).parent().attr("class", "state-item-KO validation-cell");
        } else {
            var ko_validation = "<a class='validation-disabled-KO validation' href='' onclick='return false;'";
            ko_validation += "' title='Click to mark as broken'><img src='/medias/workflow/img/validation_KO_disabled.png'/></a>";
            var ok_validation = "<a class='validation-enabled-KO validation' title='Item is validated' href='' onclick='return false;'>";
            ok_validation += "<img src='/medias/workflow/img/validation_OK.png'/></a>";
            $(el).parent().attr("class", "state-item-OK validation-cell");
        }
        var no_state_validation = "<a class='validation-disabled-None validation' href='' onclick='return false;'";
        no_state_validation += "' title='Reset item validation'><span> ? </span></a>";
    }
    $(el).parent().attr('title', "State item was updated by " + data.get('owner'));
    $(el).parent().html(ok_validation + no_state_validation + ko_validation);
}

/* ***************** */

/* Show detail of one item */

function _display_one_comment(comment, iterator) {
    var blockComment = "<div class='one_comment'>";
    blockComment += "<h3><span id='ancre_comment'><a name='" + iterator + "'";
    blockComment += " href='#" + iterator + "' title='Comment anchor - " + iterator + "'>";
    blockComment += "#" + iterator + "</a></span> - " + comment.date + " - " + comment.person_firstname + " " + comment.person_lastname.toUpperCase() + "</h3>";
    blockComment += "<pre>" + comment.comment + "</pre>";
    blockComment += "</div>";
    return blockComment;
}

function _display_item_detailAndComment(resp, el) {
    if (resp.detail.length) {
        $(el).find("pre.details_item").html(resp.detail);
    } else {
        $(el).find("pre.details_item").html("** No details **");
    }
    if (resp.comments.length) {
        $(el).find("pre.comments_item").html(_display_one_comment(resp.comments[0], 0));
        for (i = 1; i < resp.comments.length; i++) {
            $(el).find("pre.comments_item").append(_display_one_comment(resp.comments[i], i));
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
        success: function (data, textStatus, jqXHR) { _display_item_detailAndComment(data, el); },
        error: function (XMLHttpRequest, textStatus, errorThrown) { displayError(titleErrorHappened, errorHappened); }
    });
}

/* ***************** */

/* Take one item */

function _update_item_add_owner(data, link, el) {
    myID = data.assigned_to;
    var content = data.assigned_to_firstname + " " + data.assigned_to_lastname.toUpperCase();
    content += " <a title='Untake item' href='' onclick='return false;'><img src='/medias/workflow/img/untake.png' /></a>";
    $(el).attr("class", "untake-item owner-" + data.assigned_to).html(content);
    $(el).attr("id", "untake-item-" + data.item_id);
    compute_taken_untaken_items();
}

/* ***************** */

/* Untake one item */

function _update_item_reset_owner(data, link, el) {
    myID = data.assigned_to;
    var content = "<a title='Take item' href='' onclick='return false;'>take</a>";
    $(el).attr("class", "take-item owner-None").html(content);
    $(el).attr("id", "take-item-" + data.item_id);
    compute_taken_untaken_items();
}

/* ***************** */

/* Untake a whole group */

function _update_whole_group_reset_owner(data) {
    var element_to_add = $("table#category_id-" + data.category_id + " td.untake-item");
    for (i = 0; i < element_to_add.length; i++) {
        if ($(element_to_add[i]).attr("class").split(' ')[1].split('-')[1] == data.person_id) {
            data.item_id = $(element_to_add[i]).attr("id").split('-')[2];
            _update_item_reset_owner(data, null, element_to_add[i]);
        }
    }
}

/* ***************** */

/* Take a whole group */

function _update_whole_group_add_owner(data) {
    var element_to_add = $("table#category_id-" + data.category_id + " td.take-item");
    for (i = 0; i < element_to_add.length; i++) {
        data.item_id = $(element_to_add[i]).attr("id").split('-')[2];
        _update_item_add_owner(data, null, element_to_add[i]);
    }
}

/* ***************** */
