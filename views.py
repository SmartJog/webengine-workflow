from webengine.utils.decorators import render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response

from webengine.utils.log import logger

from team.models import Person
from workflow.forms import WorkflowInstanceNewForm, ItemNewForm
from workflow.models import WorkflowSection, Workflow, Category, Item, Validation, Comment, ItemTemplate

from copy import copy

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
             'id'    : section.id,\
             'instances' : Workflow.objects.filter(workflow_section=section.id).extra(select={'lower_label': 'lower(label)'}).order_by('lower_label'),
            }
        ]
    return ret

def get_admin(request):
    """ Return html chunk to admin workflow """
    return render_to_response('workflow/admin.html')

@render(view='workflow')
def workflow(request, workflow_id):
    person_id = Person.objects.filter(django_user=request.user.id)[0].id
    categories = Category.objects.filter(workflow=workflow_id).order_by('order')
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

@render(output='json')
def delete(request):
    options = {}
    for el in request.POST:
        options.update(json.loads(el))
    if 'workflow_id' in options:
        Workflow.objects.filter(id=options['workflow_id']).delete()
    elif 'item_id' in options:
        Item.objects.filter(id=options['item_id']).delete()
    elif 'category_id' in options:
        Category.objects.filter(id=options['category_id']).delete()
    return

def _copy_comments(item_id, copy_item):
    origin_comments = Comment.objects.filter(item=item_id)
    if origin_comments:
        top_comment_id = Comment.objects.order_by('-id')[0].id
        for comment in origin_comments:
            copy_comment = copy(comment)
            copy_comment.id = top_comment_id + 1
            top_comment_id = copy_comment.id
            copy_comment.item_id = copy_item.id
            copy_comment.save()

def _copy_items(category_id, copy_category, options):
    origin_items = Item.objects.filter(category=category_id)
    if origin_items:
        top_item_id = Item.objects.order_by('-id')[0].id
        for item in origin_items:
            copy_item = copy(item)
            copy_item.id = top_item_id + 1
            top_item_id = copy_item.id
            copy_item.category_id = copy_category.id
            if 'reset_validation' in options:
                copy_item.validation_id = 3 #Set validation state to None
            if 'reset_owner' in options:
                copy_item.assigned_to_id = None #Unset owner of the item

            copy_item.save()

            if not 'reset_comments' in options:
                _copy_comments(item.id, copy_item)

def _copy_categories(workflow_id, copy_workflow, options):
    origin_categories = Category.objects.filter(workflow=workflow_id)
    if origin_categories:
        top_category_id = Category.objects.order_by('-id')[0].id
        for category in origin_categories:
            copy_category = copy(category)
            copy_category.id = top_category_id + 1
            top_category_id = copy_category.id
            copy_category.workflow_id = copy_workflow.id
            copy_category.save()

            _copy_items(category.id, copy_category, options)

def copy_workflow(request):
    options = request.POST
    origin_workflow = Workflow.objects.filter(id=options['workflow_id'])[0];
    copy_workflow = copy(origin_workflow)
    copy_workflow.id = Workflow.objects.order_by('-id')[0].id + 1
    copy_workflow.label = options['label']
    copy_workflow.save()

    _copy_categories(origin_workflow.id, copy_workflow, options)
    return HttpResponseRedirect(reverse('index'))

@render(output='json')
def rename(request):
    options = request.POST
    if 'workflow_id' in options:
        new_section = None
        if options['new_section']:
            sections = WorkflowSection.objects.order_by('-id')
            top_section_id = sections and sections[0].id or 0
            new_section = WorkflowSection(top_section_id + 1, options['new_section'])
            new_section.save()

        workflow = Workflow.objects.filter(id=options['workflow_id'])[0];
        workflow.label = options['new_name']
        workflow.workflow_section_id = new_section and new_section.id or options['section']
        workflow.save()
        return {'label' : workflow.label}
    elif 'item_id' in options:
        item = Item.objects.filter(id=options['item_id'])[0]
        item.label = options['new_name']
        item.save()
        return {'label' : item.label}
    elif 'category_id' in options:
        category = Category.objects.filter(id=options['category_id'])[0]
        category.label = options['new_name']
        category.save()
    return {'label' : category.label}

def create(request):
    options = request.POST

    if 'new_item' in options:
        items = Item.objects.order_by('-id')
        top_item_id = items and items[0].id or 0
        category_id = Category.objects.filter(id=options['category'])[0].id
        new_item = Item(id=top_item_id + 1, label=options['new_item'], details=options['details'], assigned_to_id=None, validation_id=3, category_id=category_id)
        new_item.save()
        return render_to_response('workflow/one_item.html', {'item' : new_item})

    if 'new_category' in options:
        categories = Category.objects.order_by('-id')
        top_category_id = categories and categories[0].id or 0
        orders = Category.objects.order_by('-order')
        top_order = orders and orders[0].id or 0
        new_category = Category(top_category_id + 1, options['new_category'], top_order, options['workflow_id'])
        new_category.save()
        return render_to_response('workflow/one_category.html', {'category' : new_category})

    if options['new_section']:
        sections = WorkflowSection.objects.order_by('-id')
        top_section_id = sections and sections[0].id or 0
        new_section = WorkflowSection(top_section_id + 1, options['new_section'])
        new_section.save()
    else:
        new_section = WorkflowSection.objects.filter(label=options['section'])[0]

    workflows = Workflow.objects.order_by('-id')
    top_id = workflows and workflows[0].id or 0
    new_workflow = Workflow(id=top_id + 1, workflow_section=new_section, label=options['new_workflow'])
    new_workflow.save()
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

@render(output='json')
def set_order(request):
    options = request.POST
    order = {}
    for el in options:
        order.update(json.loads(el))
    for categoryId, order in order.items():
        category = Category.objects.filter(id=categoryId)[0]
        category.order = order
        category.save()
    return
