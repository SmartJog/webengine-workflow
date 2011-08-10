function deleteWorkflow(workflowId) {
    var dialog = $('#dialog-delete-workflow');
    dialog.addClass('visibile').removeClass('hidden');
    instanceLabel = $('li#instance-' + workflowId + ' a:first-child').html();
    var message = 'This action is irrecoverable !<br />Are you sure to delete <b>' + instanceLabel + '</b> ?';
    dialog.find('p').html(message);
    dialog.dialog({
        open      : function() { dialog.parents('.ui-dialog-buttonpane button:eq(0)').focus(); },
        resizable : false,
        modal     : true,
        buttons   : {
            'Delete workflow': function() {
                dialog.find('p').html('Processing...');
                $.post(
                    '/workflow/delete/',
                    JSON.stringify({'workflow_id' : workflowId}),
                    function (data) {
                        if ($('li#instance-' + workflowId).parent().find('li').length === 1) {
                            $('li#instance-' + workflowId).parents('div.workflow_list').remove();
                        }
                        $('li#instance-' + workflowId).remove();
                        dialog.dialog('close');
                    }
                );
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function deleteSection(sectionId) {
    var dialog = $('#dialog-delete-section');
    dialog.addClass('visibile').removeClass('hidden');
    instanceLabel = $('div#section-' + sectionId + ' h2').html();
    var message = 'This action is irrecoverable !<br />Are you sure to delete <b>' + instanceLabel + '</b> ?';
    dialog.find('p').html(message);
    dialog.dialog({
        open      : function() { dialog.parents('.ui-dialog-buttonpane button:eq(0)').focus(); },
        resizable : false,
        modal     : true,
        buttons   : {
            'Delete section': function() {
                dialog.find('p').html('Processing...');
                $.post(
                    '/workflow/delete/',
                    JSON.stringify({'section_id' : sectionId}),
                    function (data) {
                        $('div#section-' + sectionId).remove();
                        dialog.dialog('close');
                    }
                );
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function copyWorkflow(workflowId) {
    var dialog = $('#dialog-copy-workflow');
    dialog.addClass('visibile').removeClass('hidden');
    var instanceLabel = $('li#instance-' + workflowId + ' a:first-child').html();
    var message = instanceLabel + '_copy';
    dialog.find('input[name=label]').attr('value', message);
    dialog.dialog({
        open      : function() { dialog.find('input[type=text]').focus(); },
        title     : 'Copy workflow ' + instanceLabel,
        resizable : true,
        modal     : true,
        width     : 500,
        buttons   : {
            'Copy': function() {
                if (dialog.find('input[name=label]').attr('value')
                   && (dialog.find('input[name=new_section]').attr('value')
                   || dialog.find('input[name=new_section]').attr('readonly') === true)) {
                    dialog.find('p').html('Processing...');
                    dialog.find('form').hide();
                    $.post(
                        '/workflow/copy/',
                        dialog.find('form').serialize() + '&workflow_id=' + workflowId,
                        function () { window.location.reload(); }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function renameWorkflow(workflowId) {
    var dialog = $('#dialog-rename-workflow');
    dialog.addClass('visibile').removeClass('hidden');
    instanceLabel = $('li#instance-' + workflowId + ' a:first-child').html();
    var message = 'Current workflow name is: <b>' + instanceLabel + '</b><br /><br />';
    dialog.find('p').html(message);
    dialog.find('input[name=new_name]').attr('value', instanceLabel);
    dialog.dialog({
        open      : function() { dialog.find('input').focus(); },
        resizable : true,
        modal     : true,
        width     : 500,
        buttons   : {
            'Rename': function() {
                if (dialog.find('input[name=new_name]').attr('value')
                   && (dialog.find('input[name=new_section]').attr('value')
                   || dialog.find('input[name=new_section]').attr('readonly') === true)) {
                    dialog.find('p').html('Processing...');
                    dialog.find('form').hide();
                    $.post(
                        '/workflow/rename/',
                        dialog.find('form').serialize() + '&workflow_id=' + workflowId,
                        function () { window.location.reload(); }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function createWorkflow() {
    var dialog = $('#dialog-create-workflow');
    dialog.removeClass('hidden').addClass('visible');
    dialog.dialog({
        open      : function() { dialog.find('input').focus(); },
        resizable : true,
        modal     : true,
        width     : 500,
        buttons   : {
            'Create': function() {
                if (dialog.find('input#new_workflow_name').attr('value')) {
                    dialog.find('p').html('Processing...');
                    dialog.find('form').hide();
                    $.post(
                        '/workflow/create/',
                        dialog.find('form').serialize(),
                        function () {
                            window.location.reload();
                        }
                    );
                }
            },
            'Cancel': function() { dialog.dialog('close'); }
        }
    });
}

function onChange (form) {
    if (form.find('select option:selected').attr('id') === 'new_section') {
        form.find('label#new_section_name input').removeAttr('readonly').removeClass('lock');
    } else {
        form.find('label#new_section_name input').removeAttr('value').attr('readonly', true).addClass('lock');
    }
}
