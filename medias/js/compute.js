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
	var mine_item_cel = $("div.categories_table_workflow").find("td.owner-" + myID);
    gl_taken = taken_item_cel.length;
    gl_untaken = untaken_item_cel.length;
	gl_mine = mine_item_cel.length;
    update_statistics_filters();
}

/* ***************** */

