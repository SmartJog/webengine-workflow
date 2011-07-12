from webengine.utils.decorators import render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from webengine.utils.log import logger

from team.models import Person
from workflow.forms import WorkflowInstanceNewForm, ItemNewForm
from workflow.models import WorkflowSection, Workflow, Category, Item, Validation, Comment, ItemTemplate

import simplejson as json

@render(view='index')
def index(request):
    return {}

@render(view='new_workflow')
def new_workflow(request):
    if request.method == 'POST':
        form = WorkflowInstanceNewForm(request, data=request.POST)
        if form.is_valid():
            workflow_id = form.cleaned_data['workflow']
            persons = Person.objects.filter(django_user=request.user.id)
            if not len(persons):
                return {
                    'form'   : form,
                    'status' : 'KO',
                    'error'  : 'Your django user is not attached to a Team person',
                }
            if len(WorkflowSection.objects.filter(id=workflow_id)[0].leaders.filter(id=persons[0].id)):
                new_workflowinstance=Workflow(workflow_id=form.cleaned_data['workflow'], version = form.cleaned_data['version'])
                new_workflowinstance.save()
                categories = Category.objects.filter(workflow=workflow_id)
                for category in categories:
                    items = ItemTemplate.objects.filter(category=category.id)
                    for item in items:
                        rt = Item(validation=None, item_id = item.id, workflowinstance_id=new_workflowinstance.id)
                        rt.save()
                return HttpResponseRedirect(reverse('workflow-show', args=[new_workflowinstance.id]))
            else:
                return {
                    'status' : 'KO',
                    'error'  : 'You are not leader on this workflow',
                }
        else:
            return {
                'status' : 'KO',
                'error'  : str(form.errors),
            }
    else:
        form = WorkflowInstanceNewForm(request)

    return {
        'form'   : form,
        'status' : 'NEW',
    }

@render(view='workflow_listing')
def workflow_listing(request):
    workflows = WorkflowSection.objects.all()
    ret = {'workflows' : []}
    display = {
        'mine'       : 'mine',
        'all'        : 'all',
        'successful' : 'successful',
        'failed'     : 'failed',
        'untaken'    : 'untaken',
        'taken'      : 'taken',
    }
    for workflow in workflows:
        ret['workflows'] += [{'name' : workflow, 'workflowinstances' : Workflow.objects.filter(workflow_section=workflow)}]
        ret.update({'display' : display})
    return ret

def _fill_container(dict_to_fill, which_display, categories_order):
    for order in categories_order:
        if dict_to_fill[which_display].has_key(int(order)):
            dict_to_fill[which_display][order]['items'] = dict_to_fill[which_display][order]['items'].values()
    ret = {
        'categories' : len(dict_to_fill[which_display]) and dict_to_fill[which_display].values() or None,
        'order'      : categories_order,
    }
    return ret

def _get_all_item_for_specific_condition(category, person_id, which_display):
    """ Return list of items on demand """
    if which_display == "all":
        return Item.objects.filter(category=category)
    elif which_display == "successful":
        return Item.objects.filter(category=category, validation=1)
    elif which_display == "failed":
        return Item.objects.filter(category=category, validation=2)
    elif which_display == "untaken":
        return Item.objects.filter(category=category, assigned_to=None)
    elif which_display == "taken":
        return Item.objects.filter(category=category).exclude(assigned_to=None)
    elif which_display == "mine":
        return Item.objects.filter(category=category, assigned_to=person_id)

@render(view='show_workflow')
def show_workflow(request, workflow_id, which_display):
    categories = Category.objects.filter(workflow=workflow_id).order_by("order")
    person_id = Person.objects.filter(django_user=request.user.id)[0].id
    container = {}
    container[which_display] = {}
    if not which_display in container.keys():
        which_display = "all"
    items = []
    for category in categories:
        items += _get_all_item_for_specific_condition(category, person_id, which_display)
    categories_order = Category.objects.filter(workflow=workflow_id).order_by("order").values_list("order")
    display = {
        'mine'       : 'mine',
        'all'        : 'all',
        'successful' : 'successful',
        'failed'     : 'failed',
        'untaken'    : 'untaken',
        'taken'      : 'taken',
    }
    categories_order  = [x[0] for x in categories_order]

    for cur_item in items:
        category_id=cur_item.category_id
        container[which_display].setdefault(category_id, {'id'    : category_id,
                                                          'order' : cur_item.category.order,
                                                          'name'  : cur_item.category.label,
                                                          'items' : {},})
        container[which_display][category_id]['items'][cur_item.id] = cur_item

    return_d = {
        'workflow_id' : workflow_id,
        'myId'        : person_id,
        'display'     : display,
    }
    return_d.update(_fill_container(container, which_display, categories_order))
    return return_d

def delete_workflow(request, workflow_id):
    Workflow.objects.filter(id=workflow_id).delete()
    return HttpResponseRedirect(reverse('workflow-listing'))

def _get_comments(item_id):
    comments = Comment.objects.filter(item=item_id)
    commentsToSubmit = []
    for comment in comments:
        assigned_to = Person.objects.filter(id=comment.person_id)[0]
        owner = assigned_to and ' '.join([assigned_to.firstname, assigned_to.lastname.upper()]) or 'Unknow'
        detailComment = {
            'date'    : str(comment.date),
            'owner'   : owner,
            'comment' : comment.comments,
        }
        commentsToSubmit.append(detailComment)
    return commentsToSubmit

@render(output='json')
def item_update(request, item_id):
    """ Update item which have for item @item_id@
        if remote_item is up to date else
        return up to date item values
    """
    item = Item.objects.filter(id=item_id)[0]

    if request.META['REQUEST_METHOD'] == 'GET':
        ret = {
            'details'  : item.details,
            'comments' : _get_comments(item_id),
        }
        return ret

    remote_item = {}
    if request.META['REQUEST_METHOD'] == 'POST':
        for el in request.POST:
            remote_item.update(json.loads(el))

    local_item = {
        'assigned_to' : item.assigned_to_id,
        'validation'  : item.validation_id,
    }

    for key in local_item.keys():
        if not local_item[key] == remote_item['previousAttributes'][key]:
            owner = item.assigned_to and ' '.join([item.assigned_to.firstname, item.assigned_to.lastname.upper()]) or 'None'
            ret = {
                'HTTPStatusCode' : '409',
                'label'          : item.label,
                'assigned_to'    : item.assigned_to_id,
                'validation'     : item.validation_id,
                'state'          : item.validation.label,
                'owner'          : owner,
                'comments'       : _get_comments(item_id),
                'details'        : item.details,
            }
            return ret

    item.assigned_to_id = remote_item['assigned_to']
    item.validation_id = remote_item['validation']
    item.details = remote_item['details']
    item.save()
    if not isinstance(remote_item['comments'], list):
        person = Person.objects.filter(django_user=request.user.id)[0]
        id_comment = int(Comment.objects.all().count() + 1)
        comment = Comment(id=id_comment, item_id=item_id, person=person, comments=remote_item['comments'])
        comment.save()

    item = Item.objects.filter(id=item_id)[0]
    owner = item.assigned_to and ' '.join([item.assigned_to.firstname, item.assigned_to.lastname.upper()]) or 'None'
    ret = {
        'HTTPStatusCode' : '200',
        'label'          : item.label,
        'assigned_to'    : item.assigned_to_id,
        'validation'     : item.validation_id,
        'state'          : item.validation.label,
        'owner'          : owner,
        'comments'       : _get_comments(item_id),
        'details'        : item.details,
    }
    return ret

@render(output='json')
def item(request):
    """ Output JSON
        Return informations about all items contained in @workflow_id@
    """
    infos = {}
    for el in request.POST:
        infos.update(json.loads(el))
    categories = Category.objects.filter(workflow=infos['workflowId'])
    items = []
    for category in categories:
        items += Item.objects.filter(category=category)
    allItems = []
    for item in items:
        itemInfos = {
            'HTTPStatusCode' : '200',
            'itemId'         : item.id,
            'categoryId'     : item.category_id,
            'state'          : item.validation.label,
            'validation'     : item.validation and item.validation_id or None,
            'assigned_to'    : item.assigned_to and item.assigned_to_id or None,
            'owner'          : item.assigned_to and ' '.join([item.assigned_to.firstname, item.assigned_to.lastname.upper()]) or 'None',
            'details'        : item.details,
            'comments'       : _get_comments(item.id),
        }
        allItems.append(itemInfos)
    ret = {
        'allItems' : allItems,
    }
    return ret

def item_create(request, workflowinstanceitem_id):
    workflowinstanceitem = Item.objects.filter(id=workflowinstanceitem_id)[0]
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-show', args=[workflowinstanceitem.workflowinstance.id]))

@render(view='new_item')
def new_item(request):
    if request.method == 'POST':
        form = ItemNewForm(request, data=request.POST)
        if form.is_valid():
            workflowcategory_id = int(form.cleaned_data['category'])
            workflowcategory = Category.objects.filter(id=workflowcategory_id)[0]
            workflow = workflowcategory.workflow

            persons = Person.objects.filter(django_user=request.user.id)
            if not len(persons):
                return {
                    'form'   : form,
                    'status' : 'KO',
                    'error'  : 'Your django user is not attached to a Team person',
                }

            if len(WorkflowSection.objects.filter(id=workflow.id)[0].leaders.filter(id=persons[0].id)):

                for label in form.cleaned_data['items'].splitlines():
                    label = label.strip()
                    if not label:
                        continue
                    item=ItemTemplate(category_id=workflowcategory_id, label=label)
                    item.save()
                return {'status' : 'OK',}
            else:
                return {
                    'status' : 'KO',
                    'error' : 'You are not leader on this workflow',
                }

        else:
            return {
                'status' : 'KO',
                'error' : str(form.errors),
            }
    else:
        form = ItemNewForm(request)

    return {
        'form' : form,
        'status' : 'NEW',
    }
