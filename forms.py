# -*- coding: utf-8 -*-

from django import forms
from django.utils.translation import ugettext_lazy as _
import re

from workflow.models import *

def get_workflows():
    return reduce(lambda all_workflows, workflow: all_workflows + [[workflow.id, workflow]], WorkflowSection.objects.all(), [])

def get_categories():
    return reduce(lambda all_categories, category: all_categories + [[category.id, category]], Category.objects.all(), [])

class WorkflowInstanceNewForm(forms.Form):
    def __init__(self, request, *args, **kwargs):
        super(WorkflowInstanceNewForm, self).__init__(*args, **kwargs)

        self.request = request
        self.fields['workflow'] = forms.ChoiceField(label=_("Workflow"), choices=get_workflows())
        self.fields['version']    = forms.CharField(label="Major")

class ItemNewForm(forms.Form):
    def __init__(self, request, *args, **kwargs):
        super(ItemNewForm, self).__init__(*args, **kwargs)

        self.request = request
        self.fields['category'] = forms.ChoiceField(label=_("Category"), choices=get_categories())
        self.fields['items']    = forms.CharField ( widget=forms.widgets.Textarea(), label="Items")
