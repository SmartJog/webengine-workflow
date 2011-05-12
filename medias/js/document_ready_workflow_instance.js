$(document).ready(function() {
	$("#progress_bar").append(progressbar);
	update_statistics_progressbar();
	update_statistics_filters();
	$(".category_workflow td.take-item").live("click", update_item_add_owner);
	$(".category_workflow td.untake-item").live("click", update_item_reset_owner);
	$("a.untake-group").live("click", update_whole_group_reset_owner);
	$("a.take-group").live("click", update_whole_group_add_owner);


    workflowItem = Backbone.Model.extend({
        url         : function () {
            var targetURL = this.attributes.baseURL;
            targetURL += "validate/" + this.id + '/';
            targetURL += this.attributes.state == "OK" ? "KO/" : "OK/";
            return targetURL;
        },
        validate    : function (attrs) {
        },
        initialize  : function(options) {
            this.attributes.owner = options.owner ? options.owner.data.trim() : null;
            this.id = this.attributes.detailURL.split('/')[this.attributes.detailURL.split('/').length - 2];
            this.attributes.baseURL = "/workflow/workflowinstance/item/";
        }
    });

    workflowItemCollection = Backbone.Collection.extend({
        model   :   workflowItem,
    });

    workflowItemView = Backbone.View.extend({
        events  : {
            "click a.shortcut"      :       "updateItemState"
        },
        updateItemState : function(e) {
            this.model.fetch({
                success : function(model, resp) {
                    _update_item_shortcut(resp, model.url(), $(e.target).parent());
                    var stateItem = model.get("state");
                    model.set({state : stateItem == "OK" ? "KO" : "OK"});
                },
                error   : function(model, resp) {
                    alert("KO");
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
