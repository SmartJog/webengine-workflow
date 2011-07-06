function displayError(title, errorMessage) {
   $("div#dialogError").attr("style", "visibility: visible;");
   $("div#dialogError").attr("title", title);
   $("div#dialogError p").html(errorMessage);
   $("div#dialogError").dialog({
      modal    : true,
      buttons  : {
         Ok    : function () {
            if (errorMessage === errorHappened) {
                location.reload();
            } else {
                mainView._refreshPage();
            }
            $("div#dialogError").attr("style", "visibility: hidden;");
            $(this).dialog("close");
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

// URLs
var checkBaseURL = "/workflow/check/";
