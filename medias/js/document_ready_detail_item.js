$(document).ready(function() {
	$("td a.shortcut").live("click", update_item_shortcut);
	$("td.take-item").live("click", update_item_add_owner);
	$("td.untake-item").live("click", update_item_reset_owner);
});
