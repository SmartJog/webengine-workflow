from django.conf.urls.defaults import *

urlpatterns = patterns('workflow',
    url(r'^$', 'views.index', name='workflowinstance'),
    url(r'^workflowinstance/new/$',                                                                     'views.workflowinstance_new',               name='workflow-workflowinstance-new'),
    url(r'^workflowinstance/list/$',                                                                    'views.workflowinstance_list',              name='workflow-workflowinstance-list'),
    url(r'^workflowinstance/show/(?P<workflowinstance_id>\d+)/$',                                       'views.workflowinstance_show',              name='workflow-workflowinstance-show'),
    url(r'^workflowinstance/delete/(?P<workflowinstance_id>\d+)/$',                                     'views.workflowinstance_delete',            name='workflow-workflowinstance-delete'),
    url(r'^workflowinstance/category/take/(?P<workflowinstance_id>\d+)/(?P<category_id>\d+)/$',         'views.workflowinstance_take_category',     name='workflow-workflowinstance-take_category'),
    url(r'^workflowinstance/category/untake/(?P<workflowinstance_id>\d+)/(?P<category_id>\d+)/$',       'views.workflowinstance_untake_category',     name='workflow-workflowinstance-untake_category'),
    url(r'^workflowinstance/item/take/(?P<workflowinstanceitem_id>\d+)/$',                              'views.workflowinstanceitem_take',          name='workflow-workflowinstanceitem-take'),
    url(r'^workflowinstance/item/untake/(?P<workflowinstanceitem_id>\d+)/$',                            'views.workflowinstanceitem_untake',        name='workflow-workflowinstanceitem-untake'),
    url(r'^workflowinstance/item/validate/(?P<workflowinstanceitem_id>\d+)/(?P<validation_id>\d+)/$',   'views.workflowinstanceitem_validate',      name='workflow-workflowinstanceitem-validate'),
    url(r'^workflowinstance/item/invalidate/(?P<workflowinstanceitem_id>\d+)/$',                        'views.workflowinstanceitem_invalidate',    name='workflow-workflowinstanceitem-invalidate'),
    url(r'^workflowinstance/item/show/(?P<workflowinstanceitem_id>\d+)/$',                              'views.workflowinstanceitem_show',          name='workflow-workflowinstanceitem-show'),
    url(r'^workflow/item/new/$', 'views.item_new', name='workflow-item-new'),
    # Add other urls
)

menus = {
    'title' : 'Workflow',
    'url': '/workflow/',
    'position': 1
}

