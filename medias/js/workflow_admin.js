function rename (el, elType) {
    var dialog = $('#dialog-rename');
    var label = $(el).find('span.label').html();
    var message = 'Current ' + elType + ' name is: <b>' + label + '</b><br /><br />';
    dialog.removeClass('hidden').addClass('visible');
    dialog.find('p').html(message);
    dialog.find('input').attr('value', label).attr('style', 'width: 100%;');
    dialog.dialog({
        open      : function() { dialog.find('input').focus(); },
        title     : 'Rename ' + elType,
        resizable : false,
        modal     : true,
        buttons   : {
            'Rename': function() {
                dialog.find('p').html('Processing...');
                dialog.find('form').hide();
                var id = elType === 'category' ? $(el).parents('table').attr('id').match('\\d+$') : $(el).attr('id').match('\\d+$');
                if (dialog.find('input[type=text]').attr('value')) {
                   $.post(
                       '/workflow/rename/',
                       dialog.find('form').serialize() + '&' + elType + '_id=' + id,
                       function (data) {
                            $(el).find('span.label').html(data.label);
                            dialog.find('form').show();
                            dialog.dialog('close');
                        }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function _delete(el, elType) {
    var dialog = $('#dialog-delete');
    var label = $(el).find('span.label').html();
    var message = 'This action is irrecoverable !<br />Are you sure to delete <b>' + label + '</b> ?';
    dialog.removeClass('hidden').addClass('visible');
    dialog.find('p').html(message);
    dialog.dialog({
        open      : function() { dialog.parents('.ui-dialog-buttonpane button:eq(0)').focus(); },
        title     : 'Delete ' + elType,
        resizable : false,
        modal     : true,
        buttons   : {
            'Delete': function() {
                dialog.find('p').html('Processing...');
                var id = elType === 'category' ? $(el).parents('table').attr('id').match('\\d+$') : $(el).attr('id').match('\\d+$');
                $.post(
                    '/workflow/delete/',
                    elType === 'category' ? JSON.stringify({'category_id' : parseInt(id)}) : JSON.stringify({'item_id' : parseInt(id)}),
                    function (data) {
                        if (elType === 'item' && $(el).parents('table.category_workflow').find('tr.highlight').length === 1) {
                             $(el).parents('table.category_workflow').remove();
                        }
                        if (elType == 'category') {
                            $(el).parents('table').remove();
                            _numbering($('table.category_workflow th span.label'));
                        } else {
                            var categoryId = $(el[0]).parents('table.category_workflow').attr('id').match('\\d+$');
                            $(el).remove();
                            _numbering($('table#category_id-' + categoryId + ' .item_table a.label_item span.label'));
                        }
                        dialog.dialog('close');
                    }
                );
            },
           'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function createCategory() {
    var dialog = $('#dialog-create-category');
    dialog.removeClass('hidden').addClass('visible');
    dialog.dialog({
        open      : function() { dialog.find('input').focus(); },
        title     : 'Create category',
        resizable : true,
        modal     : true,
        width     : 500,
        buttons   : {
            'Create': function() {
                if (dialog.find('input').attr('value')) {
                    dialog.find('p').html('Processing...');
                    dialog.find('form').hide();
                    $.post(
                        '/workflow/create/',
                        dialog.find('form').serialize() + '&workflow_id=' + gl_workflowId,
                        function (data) {
                            $('div.categories_table_workflow').append(data);
                            _numbering($('table.category_workflow th span.label'));
                            mainView._generateMainView();
                            mainView._refreshPage();
                            dialog.dialog('close');
                            dialog.find('form').show().find('input').attr('value', '');
                            dialog.find('p').html('');
                        }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function _updateCategoriesSelector() {
     var categories = $('tr.category-header span.label');
     var categoriesSelector = $('#dialog-create-item select');
     categoriesSelector.html('');
     _.each(mainView.categoriesView, function (category) {
         var option = '<option value=' + category.id + '>' + category.label + '</option>';
         categoriesSelector.append(option);
    });
}

function _numbering(selector) {
    var matchedEl = $(selector);
    for (var i = 0; i < matchedEl.length; i++) {
        $(matchedEl[i]).parent().html(i + 1 + " - <span class='label'>" + $(matchedEl[i]).html() + '</span>');
    }
}

function createItem() {
    _updateCategoriesSelector();
    var dialog = $('#dialog-create-item');
    dialog.removeClass('hidden').addClass('visible');
    dialog.dialog({
        open      : function() { dialog.find('input').focus(); },
        title     : 'Create Item',
        resizable : true,
        modal     : true,
        width     : 500,
        buttons   : {
            'Create Item': function() {
                if (dialog.find('input').attr('value') && dialog.find('select option:selected').length) {
                    dialog.find('p').html('Processing...');
                    dialog.find('form').hide();
                    $.post(
                        '/workflow/create/',
                        dialog.find('form').serialize() + '&workflow_id=' + gl_workflowId,
                        function (data) {
                            var selectedCategory = $('select option:selected').attr('value');
                            $('table#category_id-'  + selectedCategory).append(data);
                            var categoryId = dialog.find('select option:selected').attr('value');
                            _numbering($('table#category_id-' + categoryId + ' .item_table a.label_item span.label'));
                            mainView._generateMainView();
                            mainView._refreshPage();
                            dialog.dialog('close');
                            dialog.find('form').show();
                            dialog.find('p').html('');
                            dialog.find('input').attr('value', '');
                            dialog.find('textarea').attr('value', '');
                        }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}
