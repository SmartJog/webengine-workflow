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

function deleteItem(el) {
    var itemLabel = $(el).find('td.label span').html();
    var message = 'This action is irrecoverable !<br />Are you sure to delete <b>' + itemLabel + '</b> ?';
    $('div#dialog-delete-item').removeClass('hidden').addClass('visible');
    $('div#dialog-delete-item').find('p').html(message);
    $('div#dialog-delete-item').dialog({
        resizable : false,
        modal     : true,
        buttons   : {
            'Delete item': function() {
                $('div#dialog-delete-item').find('p').html('Processing...');
                var itemId = $(el).attr('id').match('\\d+$');
                $.post(
                    '/workflow/delete/',
                    JSON.stringify({'item_id' : parseInt(itemId)}),
                    function (data) {
                        if ($(el).parents('table.category_workflow').find('tr.highlight').length === 1) {
                             $(el).parents('table.category_workflow').remove();
                        }
                        $(el).remove();
                        $('#dialog-delete-item').dialog('close');
                    }
                );
            },
            'Cancel': function() {
                $(this).dialog('close');
            }
        }
    });
}

function deleteCategory(el) {
    var categoryLabel = $(el).find('th span').html();
    var message = 'This action is irrecoverable !<br />Are you sure to delete <b>' + categoryLabel + '</b> ?';
    $('div#dialog-delete-category').removeClass('hidden').addClass('visible');
    $('div#dialog-delete-category').find('p').html(message);
    $('div#dialog-delete-category').dialog({
        resizable : false,
        modal     : true,
        buttons   : {
            'Delete item': function() {
                $('div#dialog-delete-category').find('p').html('Processing...');
                var categoryId = $(el).parents('table').attr('id').match('\\d+$');
                $.post(
                    '/workflow/delete/',
                    JSON.stringify({'category_id' : parseInt(categoryId)}),
                    function (data) {
                        $(el).parents('table').remove();
                        $('#dialog-delete-category').dialog('close');
                    }
                );
            },
           'Cancel': function() {
               $(this).dialog('close');
            }
        }
    });
}
