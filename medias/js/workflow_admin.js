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
