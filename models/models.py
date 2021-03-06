from django.db import models
from django.contrib.auth import models as AuthModels
from workflow.models import teammodels
import datetime

class WorkflowBase(models.Model):
    class Meta:
        app_label = 'workflow'
        abstract = True

class WorkflowSection(WorkflowBase):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=32, null=False)

    def __unicode__(self):
        return "Label: %s" % (self.label)

class Workflow(WorkflowBase):
    id = models.AutoField(primary_key = True)
    creation_date = models.DateField(null=False, auto_now=True)
    label = models.CharField(max_length=128, null=False)
    workflow_section = models.ForeignKey(WorkflowSection, null=False)

    def __unicode__(self):
        return "Workflow Section: %s - Label: %s" % (self.workflow_section.label, self.label)

class Category(WorkflowBase):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=64, null=False)
    order = models.SmallIntegerField(null=False)
    workflow = models.ForeignKey(Workflow, null=False)

    def __unicode__(self):
        return "Workflow Section : %s - Workflow: %s - Label: %s"\
                % (self.workflow.workflow_section.label, self.workflow.label, self.label)

class Validation(WorkflowBase):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=32, null=False)

    def __unicode__(self):
        return self.label

class Item(WorkflowBase):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=512, null=False)
    details = models.TextField(max_length=1000, blank=True, null=True)
    assigned_to = models.ForeignKey(teammodels.Person, null=True, blank=True)
    validation = models.ForeignKey(Validation, null=False)
    category = models.ForeignKey(Category, null=False)

    def __unicode__(self):
        return "Workflow Section : %s - Workflow : %s - Category : %s - Label: %s"\
                %(self.category.workflow.workflow_section.label, self.category.workflow.label,\
                self.category.label, self.label)

class Comment(WorkflowBase):
    id = models.AutoField(primary_key=True)
    item = models.ForeignKey(Item, null=False)
    person = models.ForeignKey(teammodels.Person, null=True, blank=True)
    date = models.DateField(default=datetime.datetime.now())
    comments = models.TextField(max_length=1000, null=True, blank=True)

    def __unicode__(self):
        return self.comments

class ItemTemplate(WorkflowBase):
    id = models.AutoField(primary_key = True)
    category = models.ForeignKey(Category, null=False)
    label = models.CharField(max_length=512, null=False)
    details = models.TextField(max_length=1000, blank=True, null=True)

    def __unicode__(self):
        return "%s - %s" % (self.category, self.label)
