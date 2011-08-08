from django.conf.urls.defaults import *

urlpatterns = patterns('workflow',
    url(r'^$',                                                                          'views.index',                                      name='index'),
    url(r'^get_admin/$',                                                                'views.get_admin',                                  name='get-admin'),
    url(r'^(?P<workflow_id>\d+)/$',                                                     'views.workflow',                                   name='workflow'),
    url(r'^delete/$',                                                                   'views.delete',                                     name='delete'),
    url(r'^copy/$',                                                                     'views.copy_workflow',                              name='copy'),
    url(r'^rename/$',                                                                   'views.rename',                                     name='rename'),
    url(r'^create/$',                                                                   'views.create',                                     name='create'),
    url(r'^set_order/$',                                                                'views.set_order',                                  name='set-order'),
    url(r'^item/(?P<item_id>\d+)/$',                                                    'views.item_update',                                name='item-update'),
    url(r'^item/$',                                                                     'views.item',                                        name='item'),
)
