from django.db import models
from django.contrib.auth import models as AuthModels
from team import models as teammodels
import datetime

class WorkflowSection(models.Model):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=32, null=False)
    teams = models.ManyToManyField(teammodels.Team, null=False, blank=False)
    leaders = models.ManyToManyField(teammodels.Person, null=False, blank=False)

    def __unicode__(self):
        return self.label

class Workflow(models.Model):
    id = models.AutoField(primary_key = True)
    workflow_section = models.ForeignKey(WorkflowSection, null=False)
    creation_date = models.DateField(null=False, auto_now=True)
    label = models.CharField(max_length=128, null=False)
    
    def __unicode__(self):
        return "%s - %s" % (self.workflow_section, self.label)

class Category(models.Model):
    id = models.AutoField(primary_key = True)
    workflow_section = models.ForeignKey(WorkflowSection, null=False)
    label = models.CharField(max_length=64, null=False)

    def __unicode__(self):
        return "%s - %s" % (self.workflow_section, self.label)

class ItemTemplate(models.Model):
    id = models.AutoField(primary_key = True)
    category = models.ForeignKey(Category, null=False)
    label = models.CharField(max_length=512, null=False)
    details = models.TextField(max_length=1000, blank=True, null=True)

    def __unicode__(self):
        return "%s - %s" % (self.category, self.label)

class Validation(models.Model):
    id = models.AutoField(primary_key = True)
    label = models.CharField(max_length=32, null=False)

    def __unicode__(self):
        return self.label

class Item(models.Model):
    id = models.AutoField(primary_key = True)
    workflow = models.ForeignKey(Workflow, null=False)
    item_template = models.ForeignKey(ItemTemplate, null=False)
    validation = models.ForeignKey(Validation, null=True)
    assigned_to = models.ForeignKey(teammodels.Person, null=True, blank=True)

    def __unicode__(self):
        return "%s - %s - %s" %(self.workflow, self.item_template.category.name, self.item_template.label)

class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    item = models.ForeignKey(Item, null=False)
    person = models.ForeignKey(teammodels.Person, null=True, blank=True)
    date = models.DateField(default=datetime.datetime.now())
    comments = models.TextField(max_length=1000, null=True, blank=True)

    def __unicode__(self):
        return self.comments

class CategoriesOrder(models.Model):
    id = models.AutoField(primary_key=True)
    categories_order = models.CommaSeparatedIntegerField(max_length=200)
