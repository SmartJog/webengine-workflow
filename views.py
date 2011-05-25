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
            if len(Workflow.objects.filter(id=workflow_id)[0].leaders.filter(id=persons[0].id)):
                new_workflowinstance=WorkflowInstance(workflow_id=form.cleaned_data['workflow'], version = form.cleaned_data['version'])
                new_workflowinstance.save()
                categories = Category.objects.filter(workflow=workflow_id)
                for category in categories:
                    items = ItemTemplate.objects.filter(workflow_category=category.id)
                    for item in items:
                        rt = WorkflowInstanceItems(validation=None, item_id = item.id, workflowinstance_id=new_workflowinstance.id)
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
    workflows = Workflow.objects.all()
    ret = {'workflows' : []}
    display = { 'mine' : 'mine', 'all' : 'all', 'successful' : 'successful', 'failed' : 'failed', 'untaken' : 'untaken', 'taken' : 'taken' }
    for workflow in workflows:
        ret['workflows'] += [{'name' : workflow, 'workflowinstances' : WorkflowInstance.objects.filter(workflow=workflow)}]
        ret.update({'display' : display})
    return ret

@render(output='json')
def check_state_before_change(request, item_id, category_id, workflowinstance_id):
    """ Check if @item_id@ or @category_id@ have changed before change anything
    """
    if int(item_id):
        item = WorkflowInstanceItems.objects.filter(id=item_id)[0]
        return {"assigned_to" : item.assigned_to_id or "None",\
                "validation" : item.validation_id == 1 and "OK" or item.validation_id == 2 and "KO" or "None",\
                "item_id" : item_id}
    else:
        item_assignation_id = {}
        instance_items = WorkflowInstanceItems.objects.filter(workflowinstance=workflowinstance_id)
        for item in instance_items:
            if item.item.workflow_category_id == int(category_id):
                item_assignation_id[item.id] = item.assigned_to_id or "None"
        return {"owners_id" : item_assignation_id}

def _fill_container(dict_to_fill, which_display, categories_order):
    for category in categories_order:
        if dict_to_fill[which_display].has_key(int(category)):
            dict_to_fill[which_display][int(category)]['workflowinstanceitems'] = dict_to_fill[which_display][int(category)]['workflowinstanceitems'].values()
    categories_order = [int(x) for x in categories_order]
    return {'categories' : len(dict_to_fill[which_display]) and dict_to_fill[which_display].values() or None, 'order' : categories_order}

@render(view='workflowinstance_show')
def workflowinstance_show(request, workflowinstance_id, which_display):
    workflowinstanceitems = WorkflowInstanceItems.objects.filter(workflowinstance=workflowinstance_id)
    person_id = Person.objects.filter(django_user=request.user.id)[0].id
    categories_order = CategoriesOrder.objects.filter(id=workflowinstance_id)[0].categories_order.split(", ")
    display = { 'mine' : 'mine', 'all' : 'all', 'successful' : 'successful', 'failed' : 'failed', 'untaken' : 'untaken', 'taken' : 'taken' }
    counter = {'Total' : len(workflowinstanceitems), 'Success' : 0, 'Failed' : 0, 'Taken' : 0, 'Free' : 0, 'NotSolved' : 0, 'Mine' : 0}
    container = {'mine' : dict(),
                'successful' : dict(),
                'failed' : dict(),
                'untaken' : dict(),
                'taken' : dict(),
                'all' : dict()
                }

    if not which_display in container.keys():
        which_display = "all"
    for workflowinstanceitem in workflowinstanceitems:
        category_id=workflowinstanceitem.item.workflow_category.id
        container["all"].setdefault(category_id, {'id' : category_id, 'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
        container["all"][category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem
        if workflowinstanceitem.assigned_to_id == person_id:
            container["mine"].setdefault(category_id, {'id' : category_id, 'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
            container["mine"][category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem
            counter['Mine'] += 1
        if not workflowinstanceitem.validation_id == None:
            if workflowinstanceitem.validation_id == 1:
                container["successful"].setdefault(category_id, {'id' : category_id, 'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
                container["successful"][category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem
                counter['Success'] += 1
            elif workflowinstanceitem.validation_id == 2:
                container["failed"].setdefault(category_id, {'id' : category_id, 'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
                container["failed"][category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem
                counter['Failed'] += 1
        else:
            counter['NotSolved'] += 1
        if workflowinstanceitem.assigned_to == None:
            container["untaken"].setdefault(category_id, {'id' : category_id, 'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
            container["untaken"][category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem
            counter['Free'] += 1
        if not workflowinstanceitem.assigned_to == None:
            container["taken"].setdefault(category_id, {'id' : category_id, 'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
            container["taken"][category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem
            counter['Taken'] += 1

    return_d = {}
    return_d.update({'validations' : Validation.objects.all(), 'categories' : container["all"].values(), \
            'workflowinstance' : WorkflowInstance.objects.filter(id=workflowinstance_id)[0]})
    return_d.update({'display' : display, 'counter' : counter})
    return_d.update(_fill_container(container, which_display, categories_order))
    logger.debug(request)
    return return_d

def workflowinstance_delete(request, workflowinstance_id):
    WorkflowInstance.objects.filter(id=workflowinstance_id).delete()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-list'))

def workflowinstanceitem_assign_to_person(workflowinstanceitem, person):
    """ Change item assignation and save into db """
    workflowinstanceitem.assigned_to = person
    workflowinstanceitem.save()

@render(output='json')
def workflowinstanceitem_take(request, workflowinstanceitem_id):
    """ Output JSON for AJAX interaction
        Set owner on @workflowinstanceitem_id@
        Return @workflowinstanceitem_id@
    """
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    workflowinstanceitem_assign_to_person(workflowinstanceitem, person)
    return {"item_id" : workflowinstanceitem_id, "assigned_to_firstname" : str(person.firstname), "assigned_to_lastname" : str(person.lastname), "assigned_to" : person.id or "None"}

@render(output='json')
def workflowinstanceitem_untake(request, workflowinstanceitem_id):
    """ Output JSON for AJAX interaction
        Reset owner one @workflowinstanceitem_id@
        Return @workflowinstanceitem_id@
    """
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    workflowinstanceitem.assigned_to = None
    workflowinstanceitem.save()
    return {"item_id" : workflowinstanceitem_id, "assigned_to" : workflowinstanceitem.assigned_to_id or "None",\
            "assigned_to" : person.id or "None"}

@render(output='json')
def workflowinstance_take_category(request, workflowinstance_id, category_id):
    """ Output JSON for AJAX interaction
        Set owner on concerned items
        Return the category_id of item concerned and owner's lastname and firstname
    """
    items = WorkflowInstanceItems.objects.filter(workflowinstance__id=workflowinstance_id)
    person = Person.objects.filter(django_user=request.user.id)[0]
    for item in items:
        if item.item.workflow_category.id == int(category_id) and not item.assigned_to_id:
            workflowinstanceitem_assign_to_person(item, person)
    return {"category_id" : category_id, "assigned_to_firstname" : str(person.firstname), "assigned_to_lastname" : str(person.lastname), "assigned_to" : person.id}

@render(output='json')
def workflowinstance_untake_category(request, workflowinstance_id, category_id):
    """ Output JSON for AJAX interaction
        Reset owner on concerned items
        Return the category_id of item
    """
    items = WorkflowInstanceItems.objects.filter(workflowinstance__id=workflowinstance_id)
    person = Person.objects.filter(django_user=request.user.id)[0]
    for item in items:
        if item.item.workflow_category.id == int(category_id) and item.assigned_to_id == person.id:
            workflowinstanceitem_assign_to_person(item, None)
    return {"category_id" : category_id, "person_id" : person.id}

@render(output='json')
def workflowinstanceitem_validate(request, workflowinstanceitem_id, validation_label):
    """ Output JSON for AJAX interaction
        Change item state: Validate/Invalidate
        Return @workflowinstanceitem_id@ which is the item id
    """
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    workflowinstanceitem.validation_id = validation_label == "OK" and 1 or 2
    workflowinstanceitem.save()
    return {"item_id" : workflowinstanceitem_id, "person_lastname" : person.lastname, "person_firstname" : person.firstname}

@render(output='json')
def workflowinstanceitem_no_state(request, workflowinstanceitem_id):
    """ Reset item state
        Return @item_id@
    """
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    workflowinstanceitem.validation_id = None
    workflowinstanceitem.save()
    return {"item_id" : workflowinstanceitem_id, "person_lastname" : person.lastname, "person_firstname" : person.firstname}

@render(output='json')
def workflowinstance_get_all(request, workflowinstance_id):
    """ Return information on all items in @workflowinstance_id@ """
    items = WorkflowInstanceItems.objects.filter(workflowinstance=workflowinstance_id)
    allItems = []
    for item in items:
        itemsInfos = {}
        itemsInfos["id"] = item.id
        itemsInfos["state"] = item.validation and item.validation.id or "None"
        itemsInfos["person"] = item.assigned_to_id or "None"
        person = item.assigned_to
        itemsInfos["person_lastname"] = person and person.lastname or "None"
        itemsInfos["person_firstname"] = person and person.firstname or "None"
        allItems.append(itemsInfos)
    return {"allItems" : allItems}

@render(output='json')
def	workflowinstance_set_categories_order(request, workflowinstance_id):
    """ Set categories order in db for a particular instance of workflow """
    workflowinstance_categoriesorder = CategoriesOrder.objects.filter(id=workflowinstance_id)[0]
    if (len(request.POST["categories_id"])):
        workflowinstance_categoriesorder.categories_order = request.POST["categories_id"]
        workflowinstance_categoriesorder.save()
        return {"status" : "OK"}
    return {"status" : "KO"}

@render(output='json')
def workflowinstanceitem_show(request, workflowinstanceitem_id):
    """ Return dictionnary with comments and detail for @workflowinstanceitem_id@ """
    return_d = {}
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    if workflowinstanceitem.item.details:
        workflowinstanceitem.item.details = workflowinstanceitem.item.details
    else:
        workflowinstanceitem.item.details = []
    comments = CommentInstanceItem.objects.filter(item=workflowinstanceitem_id)
    commentsToSubmit = []
    for comment in comments:
        detailComment = {}
        detailComment["date"] = str(comment.date)
        detailComment["person_lastname"] = comment.person.lastname
        detailComment["person_firstname"] = comment.person.firstname
        detailComment["comment"] = comment.comments
        commentsToSubmit.append(detailComment)
    return_d.update({'detail' : workflowinstanceitem.item.details, "comments" : commentsToSubmit})
    return return_d

@render(output='json')
def workflowinstanceitem_comments(request, item_id):
    """ Add comment into db for @item_id@ and return appropriate status """
    if request.method == 'POST' and request.POST["new_comment"]:
        person = Person.objects.filter(django_user=request.user.id)[0]
        all_comments = CommentInstanceItem.objects.all()
        comment = CommentInstanceItem(id=int(all_comments.count() + 1), comments=request.POST["new_comment"], item_id=item_id, person=person)
        comment.save()
        return {'status' : 'OK'}
    return {'status' : 'KO'}

@render(output='json')
def workflowinstanceitem_details(request, item_id):
    """ Change detail of @item_id@ ans return appropriate status """
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=item_id)[0]
    if request.method == 'POST':
        workflowcategory = Category.objects.filter(id=workflowinstanceitem.item.workflow_category_id)[0]
        detail = ItemTemplate(id=workflowinstanceitem.item.id, workflow_category=workflowcategory, \
                    label=workflowinstanceitem.item.label, details=request.POST["new_details"])
        detail.save()
        return {'status' : 'OK'}
	return {'status' : 'KO'}

def item_create(request, workflowinstanceitem_id):
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
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

            if len(Workflow.objects.filter(id=workflow.id)[0].leaders.filter(id=persons[0].id)):

                for label in form.cleaned_data['items'].splitlines():
                    label = label.strip()
                    if not label:
                        continue
                    item=ItemTemplate(workflow_category_id=workflowcategory_id, label=label)
                    item.save()
                return {"status" : "OK"}
            else:
                return {"status" : "KO", "error" : "You are not leader on this workflow"}

        else:
            return {"status" : "KO", "error" : str(form.errors)}
    else:
        form = ItemNewForm(request)

    return {'form' : form, "status" : "NEW"}
