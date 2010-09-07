from django.db import models
from django.contrib.auth import models as AuthModels
from workflowinstance import models as TeamModels

class Team(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length = 64, null=False)
    leader = models.ForeignKey(TeamModels.Person, null=False)

    def __unicode__(self):
        return u"%s" % (self.name)

