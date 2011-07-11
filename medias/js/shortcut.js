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
