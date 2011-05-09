==============
 webengine-workflow
==============

webengine-workflow provides a web application to create, modify and track
various shared workflow such as: release procedures, check lists, TODOs, etc.

License
=======

webengine-workflow is released under the `GNU LGPL 2.1 <http://www.gnu.org/licenses/lgpl-2.1.html>`_.


Build and installation
=======================

Bootstrapping
-------------

webengine-workflow uses autotools for its build system.

If you checked out code from the git repository, you will need
autoconf and automake to generate the configure script and Makefiles.

To generate them, simply run::

    $ autoreconf -fvi

Building
--------

webengine-workflow builds like a typical autotools-based project::

    $ ./configure && make && make install


Development
===========

We use `semantic versioning <http://semver.org/>`_ for
versioning. When working on a development release, we append ``~dev``
to the current version to distinguish released versions from
development ones. This has the advantage of working well with Debian's
version scheme, where ``~`` is considered smaller than everything (so
version 1.10.0 is more up to date than 1.10.0~dev).


Authors
=======

webengine-workflow was started at SmartJog by Philippe Bridant in 2010 and
completely overhauled by Bryann Lamour in 2011. Others have since worked on it.

* Bryann Lamour <bryann.lamour@smartjog.com>
* Rémi Cardona <remi.cardona@smartjog.com>
* Philippe Bridant <philippe.bridant@smartjog.com>
