from webengine.utils.decorators import render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from webengine.utils.log import logger

from team.models import Person
from workflow.forms import WorkflowInstanceNewForm, ItemNewForm
from workflow.models import WorkflowSection, Workflow, Category, Item, Validation, Comment, ItemTemplate

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

@render(output='json')
def check_states_before_change(request, item_id, category_id):
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
    ret = {
        'categories' : len(dict_to_fill[which_display]) and dict_to_fill[which_display].values() or None,
        'order'      : categories_order,
    }
    return ret

def _compute_statistics_items(category, person_id):
    """ Compute the number of items in each categories """
    counter = {
        'Success'   : Item.objects.filter(category=category, validation=1).count(),
        'Failed'    : Item.objects.filter(category=category, validation=2).count(),
        'NotSolved' : Item.objects.filter(category=category, validation=None).count(),
        'Taken'     : Item.objects.filter(category=category).exclude(assigned_to=None).count(),
        'Free'      : Item.objects.filter(category=category, assigned_to=None).count(),
        'Mine'      : Item.objects.filter(category=category, assigned_to=person_id).count(),
    }
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

@render(view='show_workflow')
def show_workflow(request, workflow_id, which_display):
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
        'validations' : Validation.objects.all(),
        'workflow_id' : workflow_id,
        'display'     : display,
        'counter'     : counter,
    }
    return_d.update(_fill_container(container, which_display, categories_order))
    return return_d

def delete_workflow(request, workflow_id):
    Workflow.objects.filter(id=workflow_id).delete()
    return HttpResponseRedirect(reverse('workflow-listing'))

def _assign_item(item, person):
    """ Change item assignation and save into db """
    item.assigned_to = person
    item.save()

@render(output='json')
def take_item(request, item_id):
    """ Output JSON for AJAX interaction
        Set owner on @item_id@
        Return @item_id@
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    _assign_item(item, person)
    ret = {
        'item_id' : item_id,
        'assigned_to_firstname' : str(person.firstname),
        'assigned_to_lastname' : str(person.lastname),
        'assigned_to' : person.id or 'None',
    }
    return ret

@render(output='json')
def untake_item(request, item_id):
    """ Output JSON for AJAX interaction
        Reset owner one @item_id@
        Return @item_id@
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    item.assigned_to = None
    item.save()
    ret = {
        'item_id'     : item_id,
        'assigned_to' : item.assigned_to_id or 'None',
        'assigned_to' : person.id or 'None',
    }
    return ret

@render(output='json')
def take_category(request, category_id):
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
def untake_category(request, category_id):
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
def validate_item(request, item_id, validation_label):
    """ Output JSON for AJAX interaction
        Change item state: Validate/Invalidate
        Return @item_id@ which is the item id with user lastname and firstname
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    item.validation_id = validation_label == "OK" and 1 or 2
    item.save()
    ret = {
        'item_id' : item_id,
        'person_lastname' : person.lastname,
        'person_firstname' : person.firstname,
    }
    return ret

@render(output='json')
def reset_item_state(request, item_id):
    """ Reset item state
        Return @item_id@ with user lastname and firstname
    """
    item = Item.objects.filter(id=item_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    item.validation_id = None
    item.save()
    ret = {
        'item_id' : item_id,
        'person_lastname' : person.lastname,
        'person_firstname' : person.firstname,
    }
    return ret

@render(output='json')
def get_all_items(request, workflow_id):
    """ Return information on all items in @workflow_id@ """
    categories = Category.objects.filter(workflow=workflow_id)
    items = []
    for category in categories:
        items += Item.objects.filter(category=category)
    allItems = []
    for item in items:
        person = item.assigned_to
        itemInfos = {
            'itemId'           : item.id,
            'state'            : item.validation and item.validation.label or 'None',
            'person'           : item.assigned_to_id or "None",
            'person_lastname'  : person and person.lastname or "None",
            'person_firstname' : person and person.firstname or "None",
        }
        allItems.append(itemInfos)
    ret = {
        'allItems' : allItems,
    }
    return ret

@render(output='json')
def	set_workflow_categories_order(request, workflow_id):
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
        return {'HTTPStatusCode' : '200',}
    return {'HTTPStatusCode' : '400',}

@render(output='json')
def show_item(request, item_id):
    """ Return dictionnary with comments and detail for @item_id@ """
    return_d = {}
    item = Item.objects.filter(id=item_id)[0]
    if item.details:
        item.details = item.details
    else:
        item.details = []
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
    return_d = {}
    return_d.update({'details'    : item.details,\
                     'comments'   : commentsToSubmit,\
                     'categoryId' : item.category_id,\
                     'itemId'     : item.id})
    return return_d

@render(output='json')
def item_comments(request, item_id):
    """ Add comment into db for @item_id@ and return appropriate status """
    if request.method == 'POST' and request.POST["new_comment"]:
        person = Person.objects.filter(django_user=request.user.id)[0]
        all_comments = Comment.objects.all()
        comment = Comment(id=int(all_comments.count() + 1), comments=request.POST["new_comment"], item_id=item_id, person=person)
        comment.save()
        return {'status' : 'OK'}
    return {'status' : 'KO'}

@render(output='json')
def item_details(request, item_id):
    """ Change detail of @item_id@ ans return appropriate status """
    item = Item.objects.filter(id=item_id)[0]
    if request.method == 'POST':
        category = Category.objects.filter(id=item.category_id)[0]
        item.details = request.POST["new_details"]
        item.save()
        return {'status' : 'OK'}
	return {'status' : 'KO'}

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
