$(document).ready(function() {
	$("#progress_bar").append(progressbar);
	update_statistics_progressbar();
	update_statistics_filters();
	$(".category_workflow a.shortcut").live("click", update_item_shortcut);
	$(".category_workflow td.take-item").live("click", update_item_add_owner);
	$(".category_workflow td.untake-item").live("click", update_item_reset_owner);
	$("a.untake-group").live("click", update_whole_group_reset_owner);
	$("a.take-group").live("click", update_whole_group_add_owner);
});
