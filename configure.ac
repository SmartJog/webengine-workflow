dnl Process this file with autoconf to produce a configure script.
AC_INIT(webengine-workflow, 0.2.0)

dnl 2.52 is quite realistic
AC_PREREQ(2.52)

AM_INIT_AUTOMAKE([foreign tar-ustar])
AM_PATH_PYTHON

AC_PATH_PROG(TXT2TAGS, txt2tags)
AC_PATH_PROG(MSGFMT, msgfmt)

AC_SUBST([webenginedir], [\$\(datadir\)/webengine])
AC_SUBST([webengineappdir], [\$\(webenginedir\)/app/webengine])
AC_SUBST([workflowdir], [\$\(webengineappdir\)/workflow])
AC_SUBST([mediasdir], [\$\(webenginedir\)/medias/workflow])
AC_SUBST([mediascssdir], [\$\(mediasdir\)/css])
AC_SUBST([mediasimgdir], [\$\(mediasdir\)/img])
AC_SUBST([mediasjsdir], [\$\(mediasdir\)/js])
AC_SUBST([templatesdir], [\$\(webenginedir\)/templates/workflow])
AC_SUBST([localesdir], [\$\(workflowdir\)/locale])
AC_SUBST([templatetagsdir], [\$\(workflowdir\)/templatetags])
AC_SUBST([appteamdir], [\$\(workflowdir\)/appteam])

AC_CONFIG_FILES([
	Makefile
	templates/Makefile
	medias/Makefile
	medias/css/Makefile
	medias/img/Makefile
	medias/js/Makefile
	locale/Makefile
	templatetags/Makefile
	appteam/Makefile
	])
AC_OUTPUT
