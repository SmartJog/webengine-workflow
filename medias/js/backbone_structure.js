var requestIntervalAjaxCall;
var myID;

workflowItem = Backbone.Model.extend({
    initialize : function () {
        this.url = '/workflow/item/' + this.id + '/';
    }
});

workflowCategory = Backbone.Model.extend({
    url : function () {
	return this.get('targetURL');
    },
    defaults : {
	'targetURL' : 'None'
    },
    initialize : function () {
    }
});

/* Unused for now
workflowCollection = Backbone.Collection.extend({
});
*/

workflowItemView = Backbone.View.extend({
    initialize  : function () {
    },
    events  : {
	"click a.validation-disabled-None"  :       "resetItemState",
	"click a.validation-disabled-OK"    :       "updateItemState",
	"click a.validation-disabled-KO"    :       "updateItemState",
	"click td.take-item"                :       "takeOrUntakeOneItem",
	"click td.untake-item"              :       "takeOrUntakeOneItem",
	"click a.label_item"                :       "getDetailItem"
    },
    updateItemState : function (e) {
	this.model.set({actionURL : "validate/"});
	this.model.set({state : $(e.target).parent().attr("class").split(' ')[0].split('-')[2]});
	this.model.set({ajaxCallback : {
	    success : function (model, resp) {
		_update_item_shortcut(resp, model.url(), $(e.target).parent());
	    },
	    error   : function (model) {
		model.set({state : model.get("state") == "OK" ? "KO" : "OK"});
		displayError(titleErrorHappened, errorHappened);
	    }
	}});
	_item_has_changed(this.model, $(e.target).parents("td"), 0);
    },
    resetItemState  : function (e) {
	this.model.set({actionURL : "no_state/"});
	this.model.set({ajaxCallback : {
	    success : function (model, resp) {
		model.set({state : "None"});
		_update_item_shortcut(resp, model.url(), $(e.target));
	    },
	    error   : function () {
		displayError(titleErrorHappened, errorHappened);
	    }
	}});
	_item_has_changed(this.model, $(e.target).parents("td"), 0);
    },
    takeOrUntakeOneItem    : function (e) {
	var actionOnItem = $(e.target).parents("td").attr("class").split('-')[0] + '/';
	this.model.set({actionURL : actionOnItem});
	this.model.set({ajaxCallback : {
	    success : function (model, resp) {
		if (actionOnItem == "take/") {
		    _update_item_add_owner(resp, model.url(), $(e.target).parents("td"));
		} else {
		    _update_item_reset_owner(resp, model.url(), $(e.target).parents("td"));
		}
	    },
	    error   : function () {
		displayError(titleErrorHappened, errorHappened);
	    }
	}});
	_item_has_changed(this.model, $(e.target).parents("td"), 1);
    },
    getDetailItem       : function (e) {
	var prop = $("tr#detail-item-" + this.model.id).css("visibility");
	if (prop == "visible") {
	    $("tr#detail-item-" + this.model.id).css("visibility", "hidden");
	    $("tr#detail-item-" + this.model.id).fadeOut();
	} else {
	    $("tr#detail-item-" + this.model.id).css("visibility", "visible");
	    $("tr#detail-item-" + this.model.id).fadeIn();
	    var targetSection = $(e.target).parents("tr").next().find("div.title_detail_item a")[0];
	    _show_commentOrDetail(targetSection, 'detail');
	    _show_item_detail(this.model.url(this.model.get("detailURL")), $("tr#detail-item-" + this.model.id));
	}
    }
});

workflowCategoryView = Backbone.View.extend({
    events      : {
	"click td.take_untake_group"    :   "takeOrUntakeGroupOfItem"
    },
    initialize : function () {
	this.model.itemsView = {};
    },
    takeOrUntakeGroupOfItem : function (e) {
	var actionOnGroup = $(e.target).attr("class").split('-')[0] + '/';
	this.model.set({actionURL : actionOnGroup});
	this.model.set({ajaxCallback : {
	    success : function (model, resp) {
		if (actionOnGroup == "take/") {
		    _update_whole_group_add_owner(resp);
		} else {
		    _update_whole_group_reset_owner(resp);
		}
	    },
	    error   : function () {
		displayError(titleErrorHappened, errorHappened);
	    }
	}});
	_item_has_changed(this.model, $(e.target).parents("table"), 2);
    }
});

function generateBackboneModelsCollection() {
    // Generate view/models for categories
    var allCategoriesLines = $('tr.category-header');
    for (i = 0; i < allCategoriesLines.length; i++) {
        var categoryID = $(allCategoriesLines[i]).parents('table').attr('id').match('\\d+$');
	var modelToAdd = new workflowCategory({categoryId : categoryID});
	var currentCategory = new workflowCategoryView({el : $(allCategoriesLines[i]), model : modelToAdd});
	var allItemLines = $(allCategoriesLines[i]).parents('table').find('tr.highlight');
	for (y = 0; y < allItemLines.length; y++) {
            var itemID = $(allItemLines[y]).find('td.label').parent().attr('id').match('\\d+$');
	    var modelToAddItem = new workflowItem({itemId : itemID, id : parseInt(itemID)});
	    var viewToAdd = new workflowItemView({el : $(allItemLines[y]), model : modelToAddItem});
	    currentCategory.model.itemsView[viewToAdd.model.get('itemId')] = viewToAdd;
	}
    }
}

generateBackboneModelsCollection();

$(document).ready(function () {
    Backbone.emulateHTTP = true;

    $('#progress_bar').append(progressBar);
    update_statistics_progressbar();
    update_statistics_filters();

    intervalAjaxCall();
});
