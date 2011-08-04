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
                        elType === 'category' ? $(el).parents('table').remove() : $(el).remove();
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
                            if ($('div.categories_table_workflow').length) {
                                $('div.categories_table_workflow').append(data);
                                mainView._generateMainView();
                                mainView._refreshPage();
                                dialog.dialog('close');
                                dialog.find('form').show().find('input').attr('value', '');
                                dialog.find('p').html('');
                            } else {
                                window.location.reload();
                            }
                        }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}
