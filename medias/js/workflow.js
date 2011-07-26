function displayError(title, errorMessage) {
   $('div#dialogError').attr('style', 'visibility: visible;');
   $('div#dialogError').attr('title', title);
   $('div#dialogError p').html(errorMessage);
   $('div#dialogError').dialog({
      modal    : true,
      buttons  : {
         Ok    : function () {
            if (errorMessage === errorHappened) {
                location.reload();
            } else {
                mainView._refreshPage();
            }
            $('div#dialogError').attr('style', 'visibility: hidden;');
            $(this).dialog('close');
         }
      }
   });
}

// Error messages
var errorHappened = "An error happened unexpectedly. The page need to be reloaded.";
var errorPageNotUpToDate = "The item you clicked on was not up to date, and has now been refreshed. Would you like to refresh remaining items ?";

// Title box
var titleErrorPageNotUpToDate = "Page not up to date.";
var titleErrorHappened = "Error unexpectedly happened.";

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
    },
    show : function () {
        $(this.el).show();
    },
    hide : function () {
        $(this.el).hide();
    }
});

workflowCategoryView = Backbone.View.extend({
    initialize : function () {
        this.itemsView = {};
        this.bind('enabledTakeUntake', this.enabledTakeUntake);
        this.bind('disabledTakeUntake', this.disabledTakeUntake);
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
    },
    show : function () {
        $(this.el).parents('table').show();
    },
    hide : function () {
        $(this.el).parents('table').hide();
    },
    disabledTakeUntake : function () {
        $(this.el).parents('table').find('td.take_untake_group').addClass('disabled');
    },
    enabledTakeUntake : function () {
        $(this.el).parents('table').find('td.take_untake_group').removeClass('disabled');
    }
});

workflowProgressBarView = Backbone.View.extend({
    initialize : function (options) {
        _.bindAll(this, 'render', '_updateStats');
        this.modelItemsCollection = options.itemsCollection;
        this.modelItemsCollection.bind('change', this._updateStats);
        this.colors = {'successful' : '#73bd5a', 'broken' : '#dc5555', 'none' :'#babdb6'}
        this._updateStats();
    },
    render : function () {
        var workflowProgressbar = '<tr><table><tr>';
        workflowProgressbar += "<td style='width: " + this.successfulPercent + '%; background-color: ' + this.colors.successful + ";'></td>";
        workflowProgressbar += "<td style='width: " + this.brokenPercent + '%; background-color: ' + this.colors.broken + ";'></td>";
        workflowProgressbar += "<td style='width: " + this.noStatePercent + '%; background-color: ' + this.colors.none + ";'></td>";
        workflowProgressbar += "<td style='width: auto; text-align: left; padding-left: 4px;'>" + this.testedPercent + '% tested</td></tr></table></tr>';

        var progressBarStats = '<ul>';
        progressBarStats += "<li><span id='stats-success'></span> Success: " + this.statItems.successful + '</li>';
        progressBarStats += "<li><span id='stats-failed'></span> Failed Miserably: " + this.statItems.broken + '</li>';
        progressBarStats += "<li><span id='stats-unsolved'></span> Untested: " + this.statItems.none + '</li>';

        this.el.find('#progress_bar').html(workflowProgressbar);
        this.el.find('div.progress_bar_stats').html(progressBarStats);
    },
    _updateStats : function () {
        this.statItems = {'all' : 0, 'mine' : 0, 'taken' : 0, 'untaken' : 0, 'successful' : 0, 'broken' : 0, 'none' : 0};
        this.statItems.all = this.modelItemsCollection.length;
        this.modelItemsCollection.forEach(function (modelItem, key, list) {
            if (modelItem.get('assigned_to') == null) {
                this.statItems.untaken += 1;
            } else {
                if (modelItem.get('assigned_to') === gl_myId) {
                    this.statItems.mine += 1;
                }
                this.statItems.taken += 1;
            }
            if (modelItem.get('validation') === 1) {
                this.statItems.successful += 1;
            } else if (modelItem.get('validation') === 2) {
                this.statItems.broken += 1;
            } else {
                this.statItems.none += 1;
            }
        }, this);

        this.successfulPercent = this._getPercentage(this.statItems.successful, false);
        this.brokenPercent = this._getPercentage(this.statItems.broken, false);
        this.noStatePercent = this._getPercentage(this.statItems.none, false);

        this.testedPercent = this._getPercentage(this.statItems.successful + this.statItems.broken, true);

        this.render();
    },
    _getPercentage : function (value, ceil) {
        if (ceil) {
            return Math.ceil((value * 100) / this.statItems.all);
        }
        return (value * 100) / this.statItems.all;
    }
});

workflowFiltersView = Backbone.View.extend({
    initialize : function (options) {
        _.bindAll(this, 'render');
        this.filters = {
            'successful' : ['validation', 1],
            'broken'     : ['validation', 2],
            'taken'      : ['assigned_to', 'taken'],
            'untaken'    : ['assigned_to', null],
            'mine'       : ['assigned_to', gl_myId],
            'all'        : ['all', 'all']
        };
        this.enabled = 'all';
        this.categoriesView = options.categoriesView;
        this.progressBar = options.progressBar;
        this.modelItemsCollection = options.modelItemsCollection;
        this.modelItemsCollection.bind('change', this.render);
    },
    events : {
        'click input' : 'onClick'
    },
    onClick : function (e) {
        if (this.progressBar.statItems[$(e.target).attr('id')]) {
            this.enabled = $(e.target).attr('id');
            var filtersValues = this.filters[$(e.target).attr('id')];
            var filter = filtersValues[0];
            var filterValue = filtersValues[1];
            _.each(mainView.categoriesView, function (category) {
                var counter = 0;
                _.each(category.itemsView, function (itemView) {
                    if (filter === 'all') {
                        itemView.show();
                        category.show();
                        category.trigger('enabledTakeUntake');
                    } else {
                        category.trigger('disabledTakeUntake');
                        itemView.hide();
                        if (filterValue === 'taken' && itemView.model.get(filter) !== null) {
                            itemView.show();
                            counter += 1;
                        } else if (itemView.model.get(filter) === filterValue) {
                            itemView.show();
                            counter += 1;
                        }
                    }
                });
                if (counter || filter === 'all') {
                    category.show();
                } else {
                    category.hide();
                }
            });
            this.render();
        }
    },
    render : function () {
        $('input#all + span').html(' All items (' + this.progressBar.statItems.all + ')');
        $('input#mine + span').html(' My items (' + this.progressBar.statItems.mine + ')');
        $('input#untaken + span').html(' Untaken (' + this.progressBar.statItems.untaken + ')');
        $('input#taken + span').html(' Taken (' + this.progressBar.statItems.taken + ')');
        $('input#successful + span').html(' Successful items (' + this.progressBar.statItems.successful + ')');
        $('input#broken + span').html(' Broken items (' + this.progressBar.statItems.broken + ')');
    }
});

// Main view for all the workflow instance
workflowMainView = Backbone.View.extend({
    initialize : function () {
        this.categoriesView = [];
        this.modelItemsCollection = new workflowCollection();
        this.progressBar = new workflowProgressBarView({
            'el'              : $('div.progress_workflow'),
            'itemsCollection' : this.modelItemsCollection,
        });
        this.filters = new workflowFiltersView({
            'el'                   : $('div.filters_workflow'),
            'categoriesView'       : this.categoriesView,
            'progressBar'          : this.progressBar,
            'modelItemsCollection' : this.modelItemsCollection
        });
        this._generateMainView();
        this.requestRefreshPage = null;
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
            this.categoriesView.push(currentCategory);
        }
    },
    // Function which display up to date information on the page
    _updatePage : function (resp) {
        _.each(resp.allItems, function (item) {
            if (!(mainView.modelItemsCollection.get(item.itemId) == undefined)) {
                var itemModel = mainView.modelItemsCollection.get(item.itemId);
                if (!(itemModel == undefined)) {
                    var currentHTTPStatus = itemModel.get('HTTPStatusCode');
                    if (currentHTTPStatus !== '409') {
                        itemModel.set(item)
                    }
                }
            }
        });
    },
    // Make a ajax call to retrieve up to date information
    _refreshPage : function () {
        if (this.requestRefreshPage) {
            this.requestRefreshPage.abort();
        }
        this.requestRefreshPage = $.ajax({
            url: '/workflow/item/',
            data: JSON.stringify({'workflowId' : gl_workflowId}),
            type: 'POST',
            dataType: 'json',
            timeout: 3000,
            success: mainView._updatePage,
        });
        setTimeout('mainView._refreshPage()', 45000);
    }
});


$(document).ready(function () {
    Backbone.emulateHTTP = true;

    mainView = new workflowMainView();

    mainView._refreshPage();
});
