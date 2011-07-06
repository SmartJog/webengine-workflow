function update_statistics_filters() {
    $("input[type=radio]#filters-all + span").html(" All items (" + gl_total + ")");
    $("input[type=radio]#filters-mine + span").html(" My items (" + gl_mine + ")");
    $("input[type=radio]#filters-untaken + span").html(" Untaken (" + gl_untaken + ")");
    $("input[type=radio]#filters-taken + span").html(" Taken (" + gl_taken + ")");
    $("input[type=radio]#filters-successful + span").html(" Successful items (" + gl_success + ")");
    $("input[type=radio]#filters-failed + span").html(" Broken items (" + gl_failed + ")");

    $("#filters-" + location.pathname.split('/')[4]).attr("checked", "checked").parent().attr("style", "font-weight: bold;");
    if (location.pathname.split('/')[4] != "all") {
        $("div#sortable").removeAttr("id");
    } else {
        $("div#sortable").attr("id", "sortable");
    }
}

function update_statistics_progressbar() {
    $("span#stats-success").parent().html("<span id='stats-success'></span> Success: " + gl_success);
    $("span#stats-failed").parent().html("<span id='stats-failed'></span> Failed Miserably: " + gl_failed);
    $("span#stats-unsolved").parent().html("<span id='stats-unsolved'></span> Untested: " + gl_not_solved);
}
