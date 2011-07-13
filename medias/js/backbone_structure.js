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
    },
    // Retrieve the details and comments of the item
    retrieveDetailsAndComments : function () {
        this.fetch();
    },
    updateDetails : function (newDetails) {
        this.set({details : newDetails.trim()}, {silent : true});
        this.save({'previousAttributes' : this.previousAttributes()});
    },
    addComment : function (newComment) {
        if (newComment.trim()) {
            this.set({comments : newComment.trim()}, {silent : true});
            this.save({'previousAttributes' : this.previousAttributes()});
        }
    }
});

workflowCollection = Backbone.Collection.extend({
});

workflowItemView = Backbone.View.extend({
    initialize  : function () {
        this.detailEl = $('tr#detail-item-' + this.model.get('itemId'));
        $(this.detailEl).hide();
        $(this.detailEl).css('visibility', 'hidden');
        _.bindAll(this, 'render', 'renderError');
        this.model.bind('change', this.render);
        this.model.bind('error', this.renderError);
    },
    events  : {
        'click a.untake, a.take'                 : 'takeOrUntake',
        'click a.validation'                     : 'validation',
        'click a.label_item'                     : 'retrieveDetailsAndComments',
        'click button.details'                   : 'updateDetails',
        'click button.comment'                   : 'addComment',
        'click a.title_details, a.title_comment' : 'displayDetailsOrComments',
        'click button.edit_details'              : 'editDetails'
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
    retrieveDetailsAndComments : function () {
        this.additionalInformation();
        this._generateDetailsAndComments();
    },
    addComment : function (e) {
        this.model.addComment($(e.target).parent().find('textarea').attr('value'));
        $(e.target).parent().find('textarea').attr('value', '');
    },
    updateDetails : function (e) {
        this.model.updateDetails($(e.target).parent().find('textarea').attr('value'));
        $(this.detailEl).find('div.all_for_detail').children().attr('style', 'display: block;');
        $(this.detailEl).find('div.add_details').attr('style', 'display: none;');
    },
    additionalInformation       : function () {
        var prop = $(this.detailEl).css('visibility');
        if (prop === 'visible') {
            $(this.detailEl).css('visibility', 'hidden').fadeOut();
        } else {
            $(this.detailEl).css('visibility', 'visible').fadeIn();
            this.model.retrieveDetailsAndComments();
            // @targetSection@ is the div which contains the details
            this._showDetailsOrComments('details');
        }
    },
    displayDetailsOrComments : function (e) {
        if ($(e.target).attr('class') === 'title_details') {
            this._showDetailsOrComments('details');
        } else {
            this._showDetailsOrComments('comment');
        }
    },
    editDetails : function () {
        var el = $(this.detailEl).find('div.all_for_detail');
        $(el).children().attr('style', 'display: none;');
        $(this.detailEl).find('div.add_details').attr('style', 'display: block;');
        $(this.detailEl).find('div.add_details textarea').attr('value', $(el).find('pre').html());
    },
    render : function (model) {
        if (model.get('HTTPStatusCode') === '200') {
            this._updateLine();
            this._generateDetailsAndComments();
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
    },
    _displayOneComment : function (comment, iterator) {
        var blockComment = "<div class='one_comment'>";
        blockComment += "<h3><span id='ancre_comment'><a name='" + iterator + "'";
        blockComment += " href='#" + iterator + "' title='Comment anchor - " + iterator + "'>";
        blockComment += '#' + iterator + '</a></span> - ' + comment.date + ' - ' + comment.owner + '</h3>';
        blockComment += '<pre>' + comment.comment + '</pre>';
        blockComment += '</div>';
        return blockComment;
    },
    _generateDetailsAndComments : function () {
        if (this.model.get('details').length) {
            $(this.detailEl).find('pre.details_item').html(this.model.get('details'));
        } else {
            $(this.detailEl).find('pre.details_item').html('** No details **');
        }
        if (this.model.get('comments')[0]) {
            $(this.detailEl).find('pre.comments_item').html(this._displayOneComment(this.model.get('comments')[0], 0));
            for (i = 1; i < this.model.get('comments').length; i++) {
                $(this.detailEl).find('pre.comments_item').append(this._displayOneComment(this.model.get('comments')[i], i));
            }
        } else {
            $(this.detailEl).find('pre.comments_item').html('** No comments **');
        }
    },
    _showDetailsOrComments : function (what) {
        if (what == 'details') {
            $(this.detailEl).find('div.detail_on_item').removeClass('show-comments');
        } else {
            $(this.detailEl).find('div.detail_on_item').addClass('show-comments');
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

// Main view for all the workflow instance
workflowMainView = Backbone.View.extend({
    initialize : function () {
        this.modelItemsCollection = new workflowCollection();
        this._generateMainView();
    },
    _generateMainView : function () {
        // Generate view/models for categories
        var allCategoriesLines = $('tr.category-header');
        for (i = 0; i < allCategoriesLines.length; i++) {
            var categoryID = $(allCategoriesLines[i]).parents('table').attr('id').match('\\d+$');
            var currentCategory = new workflowCategoryView({el : $(allCategoriesLines[i])});
            var allItemLines = $(allCategoriesLines[i]).parents('table').find('table.item_table');
            for (y = 0; y < allItemLines.length; y++) {
                var itemID = $(allItemLines[y]).find('td.label').parent().attr('id').match('\\d+$');
                var modelToAddItem = new workflowItem({itemId : itemID, id : parseInt(itemID)});
                this.modelItemsCollection.add(modelToAddItem);
                var viewToAdd = new workflowItemView({el : $(allItemLines[y]), model : modelToAddItem});
                currentCategory.itemsView[viewToAdd.model.get('itemId')] = viewToAdd;
            }
        }
    }
});


$(document).ready(function () {
    Backbone.emulateHTTP = true;

    $('#progress_bar').append(progressBar);
    update_statistics_progressbar();
    update_statistics_filters();
    mainView = new workflowMainView();

    intervalAjaxCall();
});
