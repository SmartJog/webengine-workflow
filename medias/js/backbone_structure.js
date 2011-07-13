var requestIntervalAjaxCall;

workflowItem = Backbone.Model.extend({
    initialize : function () {
        this.url = '/workflow/item/' + this.id + '/';
    },
    // Take or untake one item
    takeOrUntake : function (action) {
        if (action === 'take') {
            this.set({'assigned_to' : gl_myId}, {silent : true});
        } else {
            this.set({'assigned_to' : null}, {silent : true});
        }
        this.save({'previousAttributes' : this.previousAttributes()});
    },
    // Change state of one item to OK or KO
    validation : function (validation) {
        this.set({'validation' : validation}, {silent : true});
        this.save({'previousAttributes' : this.previousAttributes()});
    }
});

/* Unused for now
workflowCollection = Backbone.Collection.extend({
});
*/

workflowItemView = Backbone.View.extend({
    initialize  : function () {
        _.bindAll(this, 'render', 'renderError');
        this.model.bind('change', this.render);
        this.model.bind('error', this.renderError);
    },
    events  : {
	"click a.label_item"                :       "getDetailItem"
        'click a.untake, a.take'                 : 'takeOrUntake',
        'click a.validation'                     : 'validation'
    },
    validation : function (e) {
        var validation = null;
        if ($(e.target).parent().hasClass('validation-OK')) {
            validation = 1; // State: 'OK'
        } else if ($(e.target).parent().hasClass('validation-KO')) {
            validation = 2; // State: 'KO'
        } else {
            validation = 3; // State: 'None'
        }
        this.model.validation(validation);
    },
    takeOrUntake : function (e) {
        var action = null;
        if ($(e.target).parent().hasClass('is-untaken')) {
            action = 'take';
        } else {
            action = 'untake';
        }
        this.model.takeOrUntake(action);
    },
    render : function (model) {
        if (model.get('HTTPStatusCode') === '200') {
            this._updateLine();
        } else {
            this.renderError(model);
        }
    },
    renderError : function (model) {
        if (model.get('HTTPStatusCode') === '409') {
            displayError(titleErrorPageNotUpToDate, errorPageNotUpToDate);
        } else {
            displayError(titleErrorHappened, errorHappened);
        }
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
    _updateLine : function () {
        // Update state of item contained in @el@
        this._updateValidation();
        var target = $(this.el).find('td.take-item');
        $(target).removeClass('is-taken is-untaken');
        if (this.model.get('owner') != 'None') {
            $(target).find('a.take span').html(this.model.get('owner'));
            $(target).addClass('is-taken');
        } else {
            $(target).addClass('is-untaken');
        }
    },
    _updateValidation : function () {
        var cellToUpdate = $(this.el).find('td.validation-cell');
        var validation = this.model.get('validation');
        $(cellToUpdate).removeClass('item-validation-OK item-validation-KO item-validation-None');
        if (validation === 1) {
            $(cellToUpdate).addClass('item-validation-OK');
        } else if (validation === 2) {
            $(cellToUpdate).addClass('item-validation-KO');
        } else {
            $(cellToUpdate).addClass('item-validation-None');
        }
    }
});

workflowCategoryView = Backbone.View.extend({
    initialize : function () {
        this.itemsView = {};
    },
    events : {
        'click a.take-group'   : 'take',
        'click a.untake-group' : 'untake'
    },
    take : function () {
        _.each(this.itemsView, function (item) {
            item.model.takeOrUntake('take');
        });
    },
    untake : function () {
        _.each(this.itemsView, function (item) {
            if (item.model.get('assigned_to') == gl_myId) {
                item.model.takeOrUntake('untake');
            }
        });
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
	    currentCategory.itemsView[viewToAdd.model.get('itemId')] = viewToAdd;
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
