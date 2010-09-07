from webengine.utils.decorators import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse



from team.models import Person
from workflow.forms import *
from workflow.models import *

@render(view='index')
def index(request):
    return {}

@login_required
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
                categories = WorkflowCategory.objects.filter(workflow=workflow_id)
                for category in categories:
                    items = Item.objects.filter(workflow_category=category.id)
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

@login_required
@render(view='workflowinstance_list')
def workflowinstance_list(request):
    workflows = Workflow.objects.all()
    ret = {'workflows' : []}
    for workflow in workflows:
        ret['workflows'] += [{'name' : workflow, 'workflowinstances' : WorkflowInstance.objects.filter(workflow=workflow)}]
    return ret

@login_required
@render(view='workflowinstance_show')
def workflowinstance_show(request, workflowinstance_id):
    workflowinstanceitems = WorkflowInstanceItems.objects.filter(workflowinstance=workflowinstance_id)
    validations = Validation.objects.all()
    categories = {}
    for workflowinstanceitem in workflowinstanceitems:
        category_id=workflowinstanceitem.item.workflow_category.id
        categories.setdefault(category_id, {'name' : workflowinstanceitem.item.workflow_category.name, 'workflowinstanceitems' : {}})
        categories[category_id]['workflowinstanceitems'][workflowinstanceitem.id] = workflowinstanceitem

    for category in categories:
        categories[category]['workflowinstanceitems'] = categories[category]['workflowinstanceitems'].values()
    
    return {'validations' : validations, 'categories' : categories.values(), 'workflowinstance' : WorkflowInstance.objects.filter(id=workflowinstance_id)[0]}

@login_required
def workflowinstance_delete(request, workflowinstance_id):
    WorkflowInstance.objects.filter(id=workflowinstance_id).delete()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-list'))

@login_required
def workflowinstanceitem_take(request, workflowinstanceitem_id):
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    person = Person.objects.filter(django_user=request.user.id)[0]
    workflowinstanceitem.assigned_to = person
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[workflowinstanceitem.workflowinstance.id]))

@login_required
def workflowinstanceitem_untake(request, workflowinstanceitem_id):
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    workflowinstanceitem.assigned_to = None
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[workflowinstanceitem.workflowinstance.id]))

@login_required
def workflowinstanceitem_validate(request, workflowinstanceitem_id, validation_id):
    person = Person.objects.filter(django_user=request.user.id)[0]

    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    workflowinstanceitem.validation_id = validation_id
    workflowinstanceitem.assigned_to = person
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[workflowinstanceitem.workflowinstance.id]))

@login_required
def workflowinstanceitem_invalidate(request, workflowinstanceitem_id):
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    workflowinstanceitem.validation_id = None
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[workflowinstanceitem.workflowinstance.id]))

@login_required
@render(view='workflowinstanceitem_show')
def workflowinstanceitem_show(request, workflowinstanceitem_id):
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    if workflowinstanceitem.item.details:
        workflowinstanceitem.item.details = workflowinstanceitem.item.details.splitlines()
    else:
        workflowinstanceitem.item.details = []
    return {'workflowinstanceitem' : workflowinstanceitem}

@login_required
def item_create(request, workflowinstanceitem_id):
    workflowinstanceitem = WorkflowInstanceItems.objects.filter(id=workflowinstanceitem_id)[0]
    workflowinstanceitem.validation_id = None
    workflowinstanceitem.save()
    return HttpResponseRedirect(reverse('workflow-workflowinstance-show', args=[workflowinstanceitem.workflowinstance.id]))

@login_required
@render(view='item_new')
def item_new(request):
    if request.method == 'POST':
        form = ItemNewForm(request, data=request.POST)
        if form.is_valid():
            workflowcategory_id = int(form.cleaned_data['category'])
            workflowcategory = WorkflowCategory.objects.filter(id=workflowcategory_id)[0]
            workflow = workflowcategory.workflow

            persons = Person.objects.filter(django_user=request.user.id)
            if not len(persons):
                return {"form" : form, "status" : "KO", "error" : "Your django user is not attached to a Team person"}

            if len(Workflow.objects.filter(id=workflow.id)[0].leaders.filter(id=persons[0].id)):

                for label in form.cleaned_data['items'].splitlines():
                    label = label.strip()
                    if not label:
                        continue
                    item=Item(workflow_category_id=workflowcategory_id, label=label)
                    item.save()
                return {"status" : "OK"}
            else:
                return {"status" : "KO", "error" : "You are not leader on this workflow"}

        else:
            return {"status" : "KO", "error" : str(form.errors)}
    else:
        form = ItemNewForm(request)

    return {'form' : form, "status" : "NEW"}
