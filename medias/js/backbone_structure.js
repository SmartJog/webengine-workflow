var requestIntervalAjaxCall;
var myID;

workflowItem = Backbone.Model.extend({
    url         : function (completeURL) {
	if (completeURL == null) {
	    var targetURL = this.attributes.baseURL;
	    targetURL += this.attributes.actionURL + this.id + '/';
	    if (this.attributes.actionURL == "validate/") {
		targetURL += this.attributes.state;
	    }
	    return targetURL;
	}
	return completeURL;
    },
    validate    : function () {
    },
    initialize  : function (options) {
	this.attributes.owner = options.owner ? options.owner.data.trim() : null;
	this.id = this.attributes.detailURL.split('/')[this.attributes.detailURL.split('/').length - 2];
	this.attributes.baseURL = "/workflow/item/";
	this.attributes.actionURL = null;
	this.attributes.ajaxCallback = null;
	$("tr#detail-item-" + this.id).hide();
	$("tr#detail-item-" + this.id).css("visibility", "hidden");
    }
});

workflowCategory = Backbone.Model.extend({
    url         : function () {
	var targetURL = this.attributes.baseURL;
	targetURL += this.attributes.actionURL;
	targetURL += this.id + '/';
	return targetURL;
    },
    initialize  : function () {
	this.attributes.baseURL = "/workflow/category/";
	this.attributes.actionURL = null;
	this.attributes.workflowId = $("div.categories_table_workflow").attr("id").split('-')[1];
	this.id = this.attributes.categoryId;
    }
});

workflowItemCollection = Backbone.Collection.extend({
    model   :   workflowItem
});

workflowItemView = Backbone.View.extend({
    events  : {
	"click a.shortcut-disabled-None"    :       "resetItemState",
	"click a.shortcut-disabled-OK"      :       "updateItemState",
	"click a.shortcut-disabled-KO"      :       "updateItemState",
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
    },
    initialize  : function () {
    }
});

workflowCategoryView = Backbone.View.extend({
    events      : {
	"click td.take_untake_group"    :   "takeOrUntakeGroupOfItem"
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
    },
    initialize   : function () {
	this.viewCollection = [];
    }
});

function generateBackboneModelsCollection() {
    // Generate view/models for categories
    var allCategoriesLines = $("tr.category-header");
    for (i = 0; i < allCategoriesLines.length; i++) {
	var categoryName = $(allCategoriesLines[i]).find("th").html();
	var categoryId = $(allCategoriesLines[i]).parents("table").attr("id").split('-')[1];
	var modelToAdd = new workflowCategory({label : categoryName, categoryId : categoryId});
	var currentCategory = new workflowCategoryView({el : $(allCategoriesLines[i]), model : modelToAdd});
	var allItemLines = $(allCategoriesLines[i]).parents("table").find("tr.highlight");
	for (y = 0; y < allItemLines.length; y++) {
	    var labelItem = $(allItemLines[y]).find("a.label_item").html();
	    var itemID = $(allItemLines[y]).find("td.label").attr("id").split('-')[2];
	    var detailItemURL = "/workflow/item/show/" + itemID + '/';
	    var ownerItem = $(allItemLines[y]).find("td.untake-item").contents()[0];
	    var stateItem = $(allItemLines[y]).find("td.shortcut-cell").attr("class").split(' ')[0].split('-')[2];
	    var modelToAddItem = new workflowItem({label : labelItem, detailURL : detailItemURL, owner : ownerItem, state : stateItem});
	    var viewToAdd = new workflowItemView({el : $(allItemLines[y]), model : modelToAddItem});
	    currentCategory.viewCollection.push(viewToAdd);
	}
    }
}

itemsCollection = new workflowItemCollection();
generateBackboneModelsCollection();

$(document).ready(function () {
    Backbone.emulateHTTP = true;

    $('#progress_bar').append(progressBar);
    update_statistics_progressbar();
    update_statistics_filters();

    intervalAjaxCall();
});
