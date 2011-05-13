$(document).ready(function() {
	$("#progress_bar").append(progressbar);
	update_statistics_progressbar();
	update_statistics_filters();
	$("a.untake-group").live("click", update_whole_group_reset_owner);
	$("a.take-group").live("click", update_whole_group_add_owner);


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
            this.model.fetch({
                success : function(model, resp) {
                    _update_item_shortcut(resp, model.url(), $(e.target).parent());
                },
                error   : function(model, resp) {
                    model.set({state : model.get("state") == "OK" ? "KO" : "OK"});
                    alert("KO"); // ********************* Display une vrai erreur ************************
                }
            });
        },
        resetItemState  : function(e) {
            this.model.set({actionURL : "no_state/"});
            this.model.fetch({
                success : function(model, resp) {
                    model.set({state : "None"});
                    _update_item_shortcut(resp, model.url(), $(e.target));
                },
                error   : function(model, resp) {
                    alert("KO"); // ********************* Display une vrai erreur ************************
                }
            });
        },
        takeOrUntakeOneItem    : function(e) {
            var actionOnItem = $(e.target).parents("td").attr("class").split('-')[0] + '/';
            this.model.set({actionURL : actionOnItem});
            this.model.fetch({
                success : function(model, resp) {
                   if (actionOnItem == "take/") {
                    _update_item_add_owner(resp, model.url(), $(e.target).parents("td"));
                    } else {
                    _update_item_reset_owner(resp, model.url(), $(e.target).parents("td"));
                    }
                },
                error   : function(model, resp) {
                    alert("KO"); // ********************* Display une vrai erreur ************************
                }
            });
        },
        initialize  : function() {
        }
    });

    function generateBackboneModelsCollection() {
        var allItemLines = $("tr.highlight");
        for (var i = 0 ; i < allItemLines.length ; i++) {
            var labelItem = $(allItemLines[i]).find("a.item_workflow").html();
            var detailItemURL = $(allItemLines[i]).find("a.item_workflow").attr("href");
            var ownerItem = $(allItemLines[i]).find("td.untake-item").contents()[0];
            var stateItem = $(allItemLines[i]).find("td[id|=action-shortcuts]").attr("class").split('-')[2];
            var modelToAdd = new workflowItem({label : labelItem, detailURL : detailItemURL, owner : ownerItem, state : stateItem});
            itemsCollection.add(modelToAdd, {silent : true});
            new workflowItemView({el : $(allItemLines[i]), model : modelToAdd});
        }
    }

    itemsCollection = new workflowItemCollection();
    generateBackboneModelsCollection();
});
