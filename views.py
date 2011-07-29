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
    """ Return the list of all the workflow instance """
    workflow_all = []
    workflow_sections = WorkflowSection.objects.all().extra(select={'lower_label': 'lower(label)'}).order_by('lower_label')
    ret = {
        'workflow_sections' : [],
    }
    for section in workflow_sections:
        ret['workflow_sections'] += [
            {'label' : section.label,\
             'instances' : Workflow.objects.filter(workflow_section=section.id).extra(select={'lower_label': 'lower(label)'}).order_by('lower_label'),
            }
        ]
    return ret

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

@render(view='workflow')
def workflow(request, workflow_id):
    person_id = Person.objects.filter(django_user=request.user.id)[0].id
    categories = Category.objects.filter(workflow=workflow_id).order_by('id')
    workflow_label = Workflow.objects.filter(id=workflow_id)[0].label
    container = []
    for category in categories:
        tmp = {
            'items' : Item.objects.filter(category=category.id).order_by('id'),
            'name' : category.label,
            'id' : category.id
        }
        container.append(tmp)
    ret = {
        'workflow_id' : workflow_id,
        'workflow_label' : workflow_label,
        'myId'        : person_id,
        'categories'  : container,
    }
    return ret

def delete_workflow(request, workflow_id):
    Workflow.objects.filter(id=workflow_id).delete()
    return HttpResponseRedirect(reverse('index'))

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
