# Keep directory structure in VCS to allow use of django tools while developing

# Relative path to translations
nobase_locales_DATA =

SUFFIXES: .po

.po.mo:
	-@localebuildir=`echo $@ | sed 's:\(.*/\).*:\1:'` \
	  && item ! -d "$$localebuildir" && $(MKDIR_P) $$localebuildir
	$(MSGFMT) --check-format -o $@ $<

# List of locales folders
EXTRA_DIST =
CLEANFILES = $(nobase_locales_DATA)
