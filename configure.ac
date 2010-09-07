dnl Process this file with autoconf to produce a configure script.
AC_INIT(webengine-workflowinstance, 0.1.0~dev)

dnl 2.52 is quite realistic
AC_PREREQ(2.52)

AM_INIT_AUTOMAKE([foreign tar-ustar])
AM_PATH_PYTHON

AC_PROG_SJCONF
AC_PATH_PROG(TXT2TAGS, txt2tags)
AC_PATH_PROG(MSGFMT, msgfmt)

AC_SUBST([webenginedir], [\$\(datadir\)/webengine])
AC_SUBST([webengineappdir], [\$\(webenginedir\)/app/webengine])
AC_SUBST([workflowinstancedir], [\$\(webengineappdir\)/workflowinstance])
AC_SUBST([mediasdir], [\$\(webenginedir\)/medias/workflowinstance])
AC_SUBST([mediascssdir], [\$\(mediasdir\)/css])
AC_SUBST([mediasimgdir], [\$\(mediasdir\)/img])
AC_SUBST([mediasjsdir], [\$\(mediasdir\)/js])
AC_SUBST([templatesdir], [\$\(webenginedir\)/templates/workflowinstance])
AC_SUBST([localesdir], [\$\(workflowinstancedir\)/locale])

AC_CONFIG_FILES([
	Makefile
	templates/Makefile
	medias/Makefile
	medias/css/Makefile
	medias/img/Makefile
	medias/js/Makefile
	locale/Makefile
	sjconf/Makefile
	sjconf/plugins/webengine-workflowinstance.py
	sjconf/templates/Makefile
	sjconf/templates/webengine-workflowinstance/Makefile
	sjconf/confs/Makefile
	sjconf/doc/Makefile
	])
AC_OUTPUT
