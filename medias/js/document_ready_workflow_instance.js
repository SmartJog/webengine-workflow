$(document).ready(function() {
	$("#progress_bar").append(progressbar);
	update_statistics_progressbar();
	update_statistics_filters();

    workflowItem = Backbone.Model.extend({
        url         : function () {
            var targetURL = this.attributes.baseURL;
            targetURL += this.attributes.actionURL + this.id + '/';
            if (this.attributes.actionURL == "validate/") {
                targetURL += this.attributes.state;
            }
            return targetURL;
        },
        validate    : function (attrs) {
        },
        initialize  : function(options) {
            this.attributes.owner = options.owner ? options.owner.data.trim() : null;
            this.id = this.attributes.detailURL.split('/')[this.attributes.detailURL.split('/').length - 2];
            this.attributes.baseURL = "/workflow/workflowinstance/item/";
            this.attributes.actionURL = null;
            this.attributes.ajaxCallback = null;
        }
    });

    workflowCategory = Backbone.Model.extend({
        url         : function() {
            var targetURL = this.attributes.baseURL;
            targetURL += this.attributes.actionURL + this.attributes.workflowId + '/'
            targetURL += this.id + '/';
            return targetURL;
        },
        initialize  : function(otpions) {
            this.attributes.baseURL = "/workflow/workflowinstance/category/";
            this.attributes.actionURL = null;
            this.attributes.workflowId = $("div.categories_table_workflow").attr("id").split('-')[1];
            this.id = this.attributes.categoryId;
        }
    });

    workflowItemCollection = Backbone.Collection.extend({
        model   :   workflowItem,
    });

    workflowItemView = Backbone.View.extend({
        events  : {
            "click a.shortcut-disabled-None"    :       "resetItemState",
            "click a.shortcut-disabled-OK"      :       "updateItemState",
            "click a.shortcut-disabled-KO"      :       "updateItemState",
            "click td.take-item"                :       "takeOrUntakeOneItem",
            "click td.untake-item"              :       "takeOrUntakeOneItem"
        },
        updateItemState : function(e) {
            this.model.set({actionURL : "validate/"});
            this.model.set({state : $(e.target).parent().attr("class").split(' ')[0].split('-')[2]});
            this.model.set({ajaxCallback : {
                success : function(model, resp) {
                    _update_item_shortcut(resp, model.url(), $(e.target).parent());
                },
                error   : function(model, resp) {
                    model.set({state : model.get("state") == "OK" ? "KO" : "OK"});
                    confirm("An error happened. Would you like to refresh the page ?") ? (location.reload()) : (_);
                }
            }});
            _item_has_changed(this.model, $(e.target).parents("td"), 0);
        },
        resetItemState  : function(e) {
            this.model.set({actionURL : "no_state/"});
            this.model.set({ajaxCallback :{
                success : function(model, resp) {
                    model.set({state : "None"});
                    _update_item_shortcut(resp, model.url(), $(e.target));
                },
                error   : function(model, resp) {
                    confirm("An error happened. Would you like to refresh the page ?") ? (location.reload()) : (_);
                }
            }});
            _item_has_changed(this.model, $(e.target).parents("td"), 0);
        },
        takeOrUntakeOneItem    : function(e) {
            var actionOnItem = $(e.target).parents("td").attr("class").split('-')[0] + '/';
            this.model.set({actionURL : actionOnItem});
            this.model.set({ajaxCallback : {
                success : function(model, resp) {
                   if (actionOnItem == "take/") {
                    _update_item_add_owner(resp, model.url(), $(e.target).parents("td"));
                   } else {
                   _update_item_reset_owner(resp, model.url(), $(e.target).parents("td"));
                   }
                },
                error   : function(model, resp) {
                    confirm("An error happened. Would you like to refresh the page ?") ? (location.reload()) : (_);
                }
            }});
            _item_has_changed(this.model, $(e.target).parents("td"), 1);
        },
        initialize  : function() {
        }
    });

    workflowCategoryView = Backbone.View.extend({
        events      : {
            "click td.take_untake_group"    :   "takeOrUntakeGroupOfItem"
        },
        takeOrUntakeGroupOfItem : function(e) {
            var actionOnGroup = $(e.target).attr("class").split('-')[0] + '/';
            this.model.set({actionURL : actionOnGroup});
            this.model.set({ajaxCallback : {
                success : function(model, resp) {
                    if (actionOnGroup == "take/") {
                    _update_whole_group_add_owner(resp);
                    } else {
                    _update_whole_group_reset_owner(resp);
                    }
                },
                error   : function(model, resp) {
                    confirm("An error happened. Would you like to refresh the page ?") ? (location.reload()) : (_);
                }
            }});
            _item_has_changed(this.model, $(e.target).parents("table"), 2);
        },
        initialize   : function(options) {
        }
    });

    function generateBackboneModelsCollection() {
        // Generate view/models for categories
        var allCategoriesLines = $("tr.category-header");
        for (var i = 0 ; i < allCategoriesLines.length ; i++) {
            var categoryName = $(allCategoriesLines[i]).find("th").html();
            var categoryId = $(allCategoriesLines[i]).parents("table").attr("id").split('-')[1];
            var modelToAdd = new workflowCategory({label : categoryName, categoryId : categoryId});
            new workflowCategoryView({el : $(allCategoriesLines[i]), model : modelToAdd});
        }
        // Generate view/models for  items
        var allItemLines = $("tr.highlight");
        for (var i = 0 ; i < allItemLines.length ; i++) {
            var labelItem = $(allItemLines[i]).find("a.item_workflow").html();
            var detailItemURL = $(allItemLines[i]).find("a.item_workflow").attr("href");
            var ownerItem = $(allItemLines[i]).find("td.untake-item").contents()[0];
            var stateItem = $(allItemLines[i]).find("td.shortcut-cell").attr("class").split(' ')[0].split('-')[2];
            var modelToAdd = new workflowItem({label : labelItem, detailURL : detailItemURL, owner : ownerItem, state : stateItem});
            itemsCollection.add(modelToAdd, {silent : true});
            new workflowItemView({el : $(allItemLines[i]), model : modelToAdd});
        }
    }

    itemsCollection = new workflowItemCollection();
    generateBackboneModelsCollection();
});
