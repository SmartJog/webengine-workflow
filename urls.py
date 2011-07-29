from django.conf.urls.defaults import *

urlpatterns = patterns('workflow',
    url(r'^new/$',                                                                      'views.new_workflow',                               name='workflow-new'),
    url(r'^$',                                                                          'views.index',                                      name='index'),
    url(r'^(?P<workflow_id>\d+)/$',                                                     'views.workflow',                                   name='workflow'),
    url(r'^delete/(?P<workflow_id>\d+)/$',                                              'views.delete_workflow',                            name='delete'),
    url(r'^item/(?P<item_id>\d+)/$',                                                    'views.item_update',                                name='item-update'),
    url(r'^item/new/$',                                                                 'views.new_item',                                   name='new-item'),
    url(r'^item/$',                                                                     'views.item',                                        name='item'),
)
