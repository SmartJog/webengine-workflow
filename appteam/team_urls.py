from django.conf.urls.defaults import *

urlpatterns = patterns('team',
    url(r'^$', 'views.index', name='team'),
    # Add other urls
)
urlpatterns = patterns('team',
    url(r'^$', 'views.index', name='team-index'),
    url(r'^add_person/$',                                                                     'views.team_add_person',               name='team-add-person'),
    url(r'^list_teams/$',                                                                     'views.team_list_teams',               name='team-list-teams'),
    # Add other urls
)

menus = {
    'title' : 'Team',
    'url': '/team/',
    'position': 1
}


