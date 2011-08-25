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
        this.save();
    },
    // Change state of one item to OK or KO
    validation : function (validation) {
        this.set({'validation' : validation}, {silent : true});
        this.save();
    },
    // Retrieve the details and comments of the item
    retrieveDetailsAndComments : function () {
        this.fetch();
    },
    updateDetails : function (newDetails) {
        this.set({details : newDetails}, {silent : true});
        this.save();
    },
    addComment : function (newComment) {
        if (newComment.trim()) {
            this.set({new_comment : newComment}, {silent : true});
            this.save();
        }
    },
    // Override Backbone save method
    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again
    save : function(attrs, options) {
        options || (options = {});
        if (attrs && !this.set(attrs, options)) {
            return false;
        }
        var model = this;
        var success = options.success;
        options.success = function (resp, status, xhr) {
            if (!model.set(model.parse(resp, xhr), options)) {
                return false;
            }
            if (success) {
                success(model, resp, xhr);
            }
        };
        options.error = this.wrapError(options.error, model, options);
        var method = this.isNew() ? 'create' : 'update';
        var details = this.get('details').replace(/"/g, '\\"').replace(/\n/g, '<br/>');
        this.set({'details' : escape(details)}, {silent : true});
        if ('new_comment' in this.attributes) {
            var new_comment = this.get('new_comment').replace(/"/g, '\\"').replace(/\n/g, '<br/>');
            this.set({'new_comment' : escape(new_comment)}, {silent : true});
        }
        delete this._previousAttributes['details'];
        delete this._previousAttributes['comments'];
        delete this.attributes['comments'];
        var old = this.previousAttributes();
        model.set({old : old}, {silent : true});
        Backbone.sync.call(this, method, model, options.success, options.error);
        model.unset('old');
    },
    // Override Backbone wrapError method
    // Wrap an optional error callback with a fallback error event.
    wrapError : function(onError, model, options) {
        return function(resp) {
            if (onError) {
                onError(model, resp, options);
            } else {
                model.trigger('error', model, resp, options);
            }
        };
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
        'click input.details'                    : 'updateDetails',
        'click input.comment'                    : 'addComment',
        'click a.title_details, a.title_comment' : 'displayDetailsOrComments',
        'click input.edit_details'               : 'editDetails'
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
            $(this.detailEl).css('visibility', 'hidden').hide();
        } else {
            $(this.detailEl).css('visibility', 'visible').show();
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
        $(this.detailEl).find('div.add_details textarea').attr('value', $(el).find('p').html().br2nl());
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
        blockComment += '<p>' + comment.comment + '</p>';
        blockComment += '</div>';
        return blockComment;
    },
    _generateDetailsAndComments : function () {
        if (this.model.get('details').length) {
            $(this.detailEl).find('p.details_item').html(this.model.get('details'));
        } else {
            $(this.detailEl).find('p.details_item').html('** No details **');
        }
        var comments = this.model.get('comments');
        if (comments && comments[0]) {
            $(this.detailEl).find('p.comments_item').html(this._displayOneComment(comments[0], 0));
            for (i = 1; i < comments.length; i++) {
                $(this.detailEl).find('p.comments_item').append(this._displayOneComment(comments[i], i));
            }
        } else {
            $(this.detailEl).find('p.comments_item').html('** No comments **');
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
        this.id = this.el.parents('table').attr('id').match('\\d+$')[0];
        this.label =  this.el.find('span.label').html();
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
        var workflowProgressbar = "<table cellspacing='0'><tr>";
        workflowProgressbar += "<td style='width: " + this.successfulPercent + '%; background-color: ' + this.colors.successful + ";'></td>";
        workflowProgressbar += "<td style='width: " + this.brokenPercent + '%; background-color: ' + this.colors.broken + ";'></td>";
        workflowProgressbar += "<td style='width: " + this.noStatePercent + '%; background-color: ' + this.colors.none + ";'></td>";
        workflowProgressbar += "<td style='width: auto; text-align: left; padding-left: 4px;'>" + this.testedPercent + '% tested</td></tr></table>';

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
        return ((value * 100) / this.statItems.all) - 1;
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
        this._generateMainView();
        this.requestRefreshPage = null;
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
    },
    _generateMainView : function () {
        // Generate view/models for categories
        this.categoriesView = [];
        this.modelItemsCollection = new workflowCollection();
        var allCategoriesLines = $('tr.category-header');
        for (i = 0; i < allCategoriesLines.length; i++) {
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
        $.ajax({
            url: '/workflow/item/',
            data: JSON.stringify({'workflowId' : gl_workflowId}),
            type: 'POST',
            dataType: 'json',
            timeout: 3000,
            success: mainView._updatePage,
        });
        this.requestRefreshPage = setTimeout('mainView._refreshPage()', 45000);
    }
});

function _setCategoriesOrder () {
    var categoriesOrder = {};
    var categories = $('table.category_workflow');
    for (var i = 0; i < categories.length; i++) {
        var categoryId = $(categories[i]).attr('id').match('\\d+$');
        categoriesOrder[categoryId] = i;
    }
    $.post('/workflow/set_order/', JSON.stringify(categoriesOrder),
        function () { window.location.reload(); });
}

function switchToAdmin (data) {
    clearTimeout(mainView.requestRefreshPage)

    $('div.progress_workflow').hide();
    $('div.filters_workflow').hide();

    $('td.validation-cell').html($(data).filter('div#administration-cell').html());
    $('td.take_untake_group').html($(data).filter('div#rename_delete_category').html());
    $('td.take-item, td.untake-item').addClass('disabled').find('img').remove();
    $('div#admin').html($(data).filter('div#create_box').html()).attr('id', 'admin_box');
    $('div#switch-to-admin input').attr('value', 'Save and switch to user view').attr('id', 'switch-to-user').click(function () {
        _setCategoriesOrder();
        $.post('/workflow/' + gl_workflowId + '/');
    });
    $('input.edit_details').removeClass('hidden').addClass('visible');

    $('body').append($(data).filter('div#dialog-box').html());

    $('#sortable').sortable({cancel: 'div.all_for_detail, div.all_for_comment, span.label'});
}

$(document).ready(function () {
    String.prototype.br2nl= function(){return this.split('<br>').join('\n')}
    Backbone.emulateHTTP = true;

    mainView = new workflowMainView();

    mainView._refreshPage();

    $(function () {
        $('div#switch-to-admin').click(function () {
            $.ajax({
                url      : '/workflow/get_admin/',
                type     : 'POST',
                dataType : 'html',
                timeout  : 3000,
                success  : switchToAdmin
            });
        });
    });
});
