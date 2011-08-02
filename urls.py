from django.conf.urls.defaults import *

urlpatterns = patterns('workflow',
    url(r'^$',                                                                          'views.index',                                      name='index'),
    url(r'^(?P<workflow_id>\d+)/$',                                                     'views.workflow',                                   name='workflow'),
    url(r'^delete/(?P<workflow_id>\d+)/$',                                              'views.delete_workflow',                            name='delete'),
    url(r'^copy/$',                                                                     'views.copy_workflow',                              name='copy'),
    url(r'^rename/$',                                                                   'views.rename_workflow',                            name='rename'),
    url(r'^create/$',                                                                   'views.create_workflow',                            name='create'),
    url(r'^item/(?P<item_id>\d+)/$',                                                    'views.item_update',                                name='item-update'),
    url(r'^item/new/$',                                                                 'views.new_item',                                   name='new-item'),
    url(r'^item/$',                                                                     'views.item',                                        name='item'),
)
