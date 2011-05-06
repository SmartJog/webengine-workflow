/* Display worflow progressbar */

var progressbar = function do_progressbar() {
    var failed = get_percentage(gl_failed, gl_total, 0);
    var success = get_percentage(gl_success, gl_total, 0);
    var not_solved = get_percentage(gl_not_solved, gl_total, 0);
    var size = get_percentage(gl_success + gl_failed, gl_total, 1);
    var state = new Array(3);
    var values = [success, failed, not_solved];
    var colors = ["#73bd5a", "#dc5555", "#babdb6"];

    state = fill_array(values, colors, state);
    
    var progress_bar = "<tr><table><tr>";
		for (i = 0 ; i < state.length ; i++) {
		    if (state[i][0]) {
			progress_bar += "<td style='width: " + state[i][0] + "%; background-color: " + state[i][1] + ";'></td>";
		    }
		}
		progress_bar += "<td style='width: auto; text-align: left; padding-left: 4px;'>" + size + "% tested</td></tr></table></tr>";
    return progress_bar;
}

function get_percentage(value, total, ceil) {
// @value is the number to evaluate
// @total is the number which represent the 100%
// @ceil is number for ceil the returned value or not (1 : ceil, 0 : nothing)
if (ceil == 1) {
    return Math.ceil((value * 100) / total);
    } else {
	return (value * 100) / total;
    }
}

function fill_array(values, colors, array_to_fill) {
    for (i = 0 ; i < array_to_fill.length ; i++) {
	array_to_fill[i] = new Array(2);
	array_to_fill[i][0] = values[i];
	array_to_fill[i][1] = colors[i];
    }
    return array_to_fill;
}
