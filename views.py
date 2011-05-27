from webengine.utils.decorators import render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from webengine.utils.log import logger

from team.models import Person
from workflow.forms import *
from workflow.models import *

@render(view='index')
def index(request):
    return {}

@render(view='workflowinstance_new')
def workflowinstance_new(request):
    if request.method == 'POST':
        form = WorkflowInstanceNewForm(request, data=request.POST)
        if form.is_valid():
            workflow_id = form.cleaned_data['workflow']
            persons = Person.objects.filter(django_user=request.user.id)
            if not len(persons):
                return {"form" : form, "status" : "KO", "error" : "Your django user is not attached to a Team person"}
            if len(WorkflowSection.objects.filter(id=workflow_id)[0].leaders.filter(id=persons[0].id)):
                new_workflowinstance=Workflow(workflow_id=form.cleaned_data['workflow'], version = form.cleaned_data['version'])
                new_workflowinstance.save()
                categories = Category.objects.filter(workflow=workflow_id)
                for category in categories:
                    items = ItemTemplate.objects.filter(category=category.id)
                    for item in items:
                        rt = Item(validation=None, item_id = item.id, workflowinstance_id=new_workflowinstance.id)
                        rt.save()
                return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[new_workflowinstance.id]))
            else:
                return {"status" : "KO", "error" : "You are not leader on this workflow"}
        else:
            return {"status" : "KO", "error" : str(form.errors)}
    else:
        form = WorkflowInstanceNewForm(request)

    return {'form' : form, "status" : "NEW"}

@render(view='workflowinstance_list')
def workflowinstance_list(request):
    workflows = WorkflowSection.objects.all()
    ret = {'workflows' : []}
    display = { 'mine' : 'mine', 'all' : 'all', 'successful' : 'successful', 'failed' : 'failed', 'untaken' : 'untaken', 'taken' : 'taken' }
    for workflow in workflows:
        ret['workflows'] += [{'name' : workflow, 'workflowinstances' : Workflow.objects.filter(workflow_section=workflow)}]
        ret.update({'display' : display})
    return ret

@render(output='json')
def check_state_before_change(request, item_id, category_id, workflowinstance_id):
    """ Check if @item_id@ or @category_id@ have changed before change anything"""
    if int(item_id):
        item = Item.objects.filter(id=item_id)[0]
        return {"assigned_to" : item.assigned_to_id or "None",\
                "validation" : item.validation_id == 1 and "OK" or item.validation_id == 2 and "KO" or "None",\
                "item_id" : item_id}
    else:
        item_assignation_id = {}
        instance_items = Item.objects.filter(category=category_id)
        for item in instance_items:
            item_assignation_id[item.id] = item.assigned_to_id or "None"
        return {"owners_id" : item_assignation_id}

def _fill_container(dict_to_fill, which_display, categories_order):
    for order in categories_order:
        if dict_to_fill[which_display].has_key(int(order)):
            dict_to_fill[which_display][order]['items'] = dict_to_fill[which_display][order]['items'].values()
    return {'categories' : len(dict_to_fill[which_display]) and dict_to_fill[which_display].values()\
            or None, 'order' : categories_order}

def _compute_statistics_items(category, person_id):
    """ Compute the number of items in each categories """
    counter = {}
    counter['Success'] = Item.objects.filter(category=category, validation=1).count()
    counter['Failed'] = Item.objects.filter(category=category, validation=2).count()
    counter['NotSolved'] = Item.objects.filter(category=category, validation=None).count()
    counter['Taken'] = Item.objects.filter(category=category).exclude(assigned_to=None).count()
    counter['Free'] = Item.objects.filter(category=category, assigned_to=None).count()
    counter['Mine'] = Item.objects.filter(category=category, assigned_to=person_id).count()
    return counter

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

@render(view='workflowinstance_show')
def workflowinstance_show(request, workflow_id, which_display):
    categories = Category.objects.filter(workflow=workflow_id).order_by("order")
    person_id = Person.objects.filter(django_user=request.user.id)[0].id
    container = {}
    container[which_display] = {}
    if not which_display in container.keys():
        which_display = "all"
    items = []
    counter = {'Success' : 0, 'Failed' : 0, 'NotSolved' : 0, 'Taken' : 0, 'Free' : 0, 'Mine' : 0}
    for category in categories:
        items += _get_all_item_for_specific_condition(category, person_id, which_display)
        for key, value in _compute_statistics_items(category, person_id).items():
            counter[key] += value
    counter['Total'] = counter['Failed'] + counter['Success'] + counter['NotSolved']
    categories_order = Category.objects.filter(workflow=workflow_id).order_by("order").values_list("order")
    display = { 'mine' : 'mine', 'all' : 'all', 'successful' : 'successful',\
            'failed' : 'failed', 'untaken' : 'untaken', 'taken' : 'taken' }
    categories_order  = [x[0] for x in categories_order]

    for cur_item in items:
        category_id=cur_item.category_id
        container[which_display].setdefault(category_id,\
                {'id' : category_id, 'order' : cur_item.category.order, 'name' : cur_item.category.label,\
                'items' : {}})
        container[which_display][category_id]['items'][cur_item.id] = cur_item

    return_d = {}
    return_d.update({'validations' : Validation.objects.all(), 'workflow_id' : workflow_id})
    return_d.update({'display' : display, 'counter' : counter})
    return_d.update(_fill_container(container, which_display, categories_order))
    return return_d

def workflowinstance_delete(request, workflowinstance_id):
    Workflow.objects.filter(id=workflowinstance_id).delete()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-list'))

def _assign_item(item, person):
    """ Change item assignation and save into db """
    item.assigned_to = person
    item.save()

@render(output='json')
def workflowinstanceitem_take(request, item_id):
    """ Output JSON for AJAX interaction
        Set owner on @item_id@
        Return @item_id@
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    _assign_item(item, person)
    return {"item_id" : item_id, "assigned_to_firstname" : str(person.firstname),\
            "assigned_to_lastname" : str(person.lastname), "assigned_to" : person.id or "None"}

@render(output='json')
def workflowinstanceitem_untake(request, item_id):
    """ Output JSON for AJAX interaction
        Reset owner one @item_id@
        Return @item_id@
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    item.assigned_to = None
    item.save()
    return {"item_id" : item_id, "assigned_to" : item.assigned_to_id or "None",\
            "assigned_to" : person.id or "None"}

@render(output='json')
def workflowinstance_take_category(request, category_id):
    """ Output JSON for AJAX interaction
        Set owner on concerned items
        Return the category_id of item concerned and owner's lastname and firstname
    """
    items = Item.objects.filter(category=category_id)
    person = Person.objects.filter(django_user=request.user.id)[0]
    for item in items:
        if item.category_id == int(category_id) and not item.assigned_to_id:
            _assign_item(item, person)
    return {"category_id" : category_id, "assigned_to_firstname" : str(person.firstname), "assigned_to_lastname" : str(person.lastname), "assigned_to" : person.id}

@render(output='json')
def workflowinstance_untake_category(request, category_id):
    """ Output JSON for AJAX interaction
        Reset owner on concerned items
        Return the category_id of item
    """
    items = Item.objects.filter(category=category_id)
    person = Person.objects.filter(django_user=request.user.id)[0]
    for item in items:
        if item.category_id == int(category_id) and item.assigned_to_id == person.id:
            _assign_item(item, None)
    return {"category_id" : category_id, "person_id" : person.id}

@render(output='json')
def workflowinstanceitem_validate(request, item_id, validation_label):
    """ Output JSON for AJAX interaction
        Change item state: Validate/Invalidate
        Return @item_id@ which is the item id with user lastname and firstname
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    item.validation_id = validation_label == "OK" and 1 or 2
    item.save()
    return {"item_id" : item_id, "person_lastname" : person.lastname, "person_firstname" : person.firstname}

@render(output='json')
def workflowinstanceitem_no_state(request, item_id):
    """ Reset item state
        Return @item_id@ with user lastname and firstname
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    item.validation_id = None
    item.save()
    return {"item_id" : item_id, "person_lastname" : person.lastname, "person_firstname" : person.firstname}

@render(output='json')
def workflowinstance_get_all(request, workflow_id):
    """ Return information on all items in @workflowinstance_id@ """
    categories = Category.objects.filter(workflow=workflow_id)
    items = []
    for category in categories:
        items += Item.objects.filter(category=category)
    allItems = []
    for item in items:
        itemsInfos = {}
        itemsInfos["id"] = item.id
        itemsInfos["state"] = item.validation and item.validation_id or "None"
        itemsInfos["person"] = item.assigned_to_id or "None"
        person = item.assigned_to
        itemsInfos["person_lastname"] = person and person.lastname or "None"
        itemsInfos["person_firstname"] = person and person.firstname or "None"
        allItems.append(itemsInfos)
    return {"allItems" : allItems}

@render(output='json')
def	workflowinstance_set_categories_order(request, workflow_id):
    """ Set categories order in db for a particular instance of workflow """
    categories = Category.objects.filter(workflow=workflow_id)
    position = 0
    if (len(request.POST["categories_id"])):
        order_list = request.POST["categories_id"].split(', ')
        order_list.reverse()
        while len(order_list) > 0:
            for category in categories:
                if category.id == int(order_list[-1]):
                    category.order = position
                    category.save()
                    order_list.pop()
                    if len(order_list) == 0:
                        break
                    position += 1
        return {"status" : "OK"}
    return {"status" : "KO"}

@render(output='json')
def workflowinstanceitem_show(request, workflowinstanceitem_id):
    """ Return dictionnary with comments and detail for @workflowinstanceitem_id@ """
    return_d = {}
    workflowinstanceitem = Item.objects.filter(id=workflowinstanceitem_id)[0]
    if workflowinstanceitem.item_template.details:
        workflowinstanceitem.item_template.details = workflowinstanceitem.item_template.details
    else:
        workflowinstanceitem.item_template.details = []
    comments = Comment.objects.filter(item=workflowinstanceitem_id)
    commentsToSubmit = []
    for comment in comments:
        detailComment = {}
        detailComment["date"] = str(comment.date)
        detailComment["person_lastname"] = comment.person.lastname
        detailComment["person_firstname"] = comment.person.firstname
        detailComment["comment"] = comment.comments
        commentsToSubmit.append(detailComment)
    return_d.update({'detail' : workflowinstanceitem.item_template.details, "comments" : commentsToSubmit})
    return return_d

@render(output='json')
def workflowinstanceitem_comments(request, item_id):
    """ Add comment into db for @item_id@ and return appropriate status """
    if request.method == 'POST' and request.POST["new_comment"]:
        person = Person.objects.filter(django_user=request.user.id)[0]
        all_comments = Comment.objects.all()
        comment = Comment(id=int(all_comments.count() + 1), comments=request.POST["new_comment"], item_id=item_id, person=person)
        comment.save()
        return {'status' : 'OK'}
    return {'status' : 'KO'}

@render(output='json')
def workflowinstanceitem_details(request, item_id):
    """ Change detail of @item_id@ ans return appropriate status """
    workflowinstanceitem = Item.objects.filter(id=item_id)[0]
    if request.method == 'POST':
        workflowcategory = Category.objects.filter(id=workflowinstanceitem.item_template.category_id)[0]
        detail = ItemTemplate(id=workflowinstanceitem.item_template.id, category=workflowcategory, \
                    label=workflowinstanceitem.item_template.label, details=request.POST["new_details"])
        detail.save()
        return {'status' : 'OK'}
	return {'status' : 'KO'}

def item_create(request, workflowinstanceitem_id):
    workflowinstanceitem = Item.objects.filter(id=workflowinstanceitem_id)[0]
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[workflowinstanceitem.workflowinstance.id]))

@render(view='item_new')
def item_new(request):
    if request.method == 'POST':
        form = ItemNewForm(request, data=request.POST)
        if form.is_valid():
            workflowcategory_id = int(form.cleaned_data['category'])
            workflowcategory = Category.objects.filter(id=workflowcategory_id)[0]
            workflow = workflowcategory.workflow

            persons = Person.objects.filter(django_user=request.user.id)
            if not len(persons):
                return {"form" : form, "status" : "KO", "error" : "Your django user is not attached to a Team person"}

            if len(WorkflowSection.objects.filter(id=workflow.id)[0].leaders.filter(id=persons[0].id)):

                for label in form.cleaned_data['items'].splitlines():
                    label = label.strip()
                    if not label:
                        continue
                    item=ItemTemplate(category_id=workflowcategory_id, label=label)
                    item.save()
                return {"status" : "OK"}
            else:
                return {"status" : "KO", "error" : "You are not leader on this workflow"}

        else:
            return {"status" : "KO", "error" : str(form.errors)}
    else:
        form = ItemNewForm(request)

    return {'form' : form, "status" : "NEW"}
