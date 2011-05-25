from django.db import models
from django.contrib.auth import models as AuthModels
from team import models as teammodels
import datetime

class WorkflowSection(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length=32, null=False)
    teams = models.ManyToManyField(teammodels.Team, null=False, blank=False)
    leaders = models.ManyToManyField(teammodels.Person, null=False, blank=False)

    def __unicode__(self):
        return self.name

class Workflow(models.Model):
    id = models.AutoField(primary_key = True)
    workflow = models.ForeignKey(WorkflowSection, null=False)
    creation_date = models.DateField(null=False, auto_now=True)
    version = models.CharField(max_length=128, null=False)
    
    def __unicode__(self):
        return "%s - %s" % ( self.workflow, self.version )

class Category(models.Model):
    id = models.AutoField(primary_key = True)
    workflow = models.ForeignKey(WorkflowSection, null=False)
    name = models.CharField(max_length=64, null=False)

    def __unicode__(self):
        return "%s - %s" % ( self.workflow, self.name)

class ItemTemplate(models.Model):
    id = models.AutoField(primary_key = True)
    workflow_category = models.ForeignKey(Category, null=False)
    label = models.CharField(max_length=512, null=False)
    details = models.TextField(max_length=1000, blank=True, null=True)

    def __unicode__(self):
        return "%s - %s" % ( self.workflow_category, self.label)

class Validation(models.Model):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=32, null=False)

    def __unicode__(self):
        return self.label

class WorkflowInstanceItems(models.Model):
    id = models.AutoField(primary_key = True)
    workflowinstance = models.ForeignKey(Workflow, null=False)
    item = models.ForeignKey(ItemTemplate, null=False)
    validation = models.ForeignKey(Validation, null=True)
    assigned_to = models.ForeignKey(teammodels.Person, null=True, blank=True)

    def __unicode__(self):
        return "%s - %s - %s" %(self.workflowinstance, self.item.workflow_category.name, self.item.label)

class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    item = models.ForeignKey(WorkflowInstanceItems, null=False)
    person = models.ForeignKey(teammodels.Person, null=True, blank=True)
    date = models.DateField(default=datetime.datetime.now())
    comments = models.TextField(max_length=1000, null=True, blank=True)

    def __unicode__(self):
        return self.comments

class CategoriesOrder(models.Model):
    id = models.AutoField(primary_key=True)
    categories_order = models.CommaSeparatedIntegerField(max_length=200)
