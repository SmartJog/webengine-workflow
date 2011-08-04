function renameItem (el) {
    itemLabel = $(el).find('td.label span').html();
    var message = 'Current workflow name is: <b>' + itemLabel + '</b><br /><br />';
    $('div#dialog-rename-item').removeClass('hidden').addClass('visible');
    $('div#dialog-rename-item').find('p').html(message);
    $('div#dialog-rename-item').find('input').attr('value', itemLabel).attr('style', 'width: 100%;');
    $('div#dialog-rename-item').dialog({
        resizable : false,
        modal     : true,
        buttons   : {
            'Rename': function() {
                $(this).find('p').html('Processing...');
                $(this).find('form').hide();
                var itemId = $(el).attr('id').match('\\d+$');
                if ($(this).find('input[type=text]').attr('value')) {
                   $.post(
                       '/workflow/rename/',
                       $(this).find('form').serialize() + '&item_id=' + itemId,
                       function (data) {
                            $(el).find('td.label span').html(data.label);
                            $('div#dialog-rename-item').dialog('close');
                        }
                    );
                }
            },
            'Cancel': function() {
                $(this).dialog('close');
            }
        }
    });
}

function renameCategory (el) {
    categoryLabel = $(el).find('th span').html();
    var message = 'Current category name is: <b>' + categoryLabel + '</b><br /><br />';
    $('div#dialog-rename-category').removeClass('hidden').addClass('visible');
    $('div#dialog-rename-category').find('p').html(message);
    $('div#dialog-rename-category').find('input').attr('value', categoryLabel).attr('style', 'width: 100%;');
    $('div#dialog-rename-category').dialog({
        resizable : false,
        modal     : true,
        buttons   : {
            'Rename': function() {
                $(this).find('p').html('Processing...');
                $(this).find('form').hide();
                var categoryId = $(el).parents('table').attr('id').match('\\d+$');
                if ($(this).find('input[type=text]').attr('value')) {
                   $.post(
                       '/workflow/rename/',
                       $(this).find('form').serialize() + '&category_id=' + categoryId,
                       function (data) {
                            $(el).find('th span').html(data.label);
                            $('div#dialog-rename-category').dialog('close');
                        }
                    );
                }
            },
            'Cancel': function() {
                $(this).dialog('close');
            }
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
