from django.db import models
from django.contrib.auth import models as AuthModels

class WorkflowBase(models.Model):
    class Meta:
        app_label = 'workflow'
        abstract = True

class ContractType(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length = 64, null=False)

    def __unicode__(self):
        return u"%s" % (self.name)

class Person(WorkflowBase):
    id = models.AutoField(primary_key = True)
    firstname = models.CharField(max_length = 64, null=False)
    lastname = models.CharField(max_length = 64, null=False)
    django_user = models.ForeignKey(AuthModels.User, null=True, blank=True)
    arrival_date = models.DateField(null=False)
    departure_date = models.DateField(null=True, blank=True)
    contract_type = models.ForeignKey(ContractType, null=False)
    access_card = models.CharField(max_length = 64, null=True, blank=True)
    token_serial = models.CharField(max_length = 32, null=True, blank=True)
    phone_number = models.CharField(max_length = 32, null=True, blank=True)

    def __unicode__(self):
        return u"%s %s" % (self.firstname, self.lastname.upper())

class Team(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length = 64, null=False)
    leader = models.ForeignKey(Person, null=False)

    def __unicode__(self):
        return u"%s" % (self.name)

    def save(self, *args, **kwargs):
        super(Team, self).save(*args, **kwargs)
        tp = TeamPerson(team=self, person=self.leader)
        tp.save()

class TeamPerson(models.Model):
    id = models.AutoField(primary_key = True)
    person = models.ForeignKey(Person, null=False)
    team = models.ForeignKey(Team, null=False)

    def save(self, *args, **kwargs):
        super(TeamPerson, self).save(*args, **kwargs)
        categories = CompetencesSubjectCategory.objects.filter(part_of_team=self.team)
        for category in categories:
            competence_subjects = CompetencesSubject.objects.filter(competence_subject_category=category)
            for competence_subject in competence_subjects:
                new_comp = Competence( competence_subject_id=competence_subject.id,
                            person = self.person)
                new_comp.save()

    def __unicode__(self):
        return u"%s - %s" % (self.team, self.person)

class CompetencesSubjectCategory(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length = 255, null=False)
    part_of_team = models.ForeignKey(Team, null=False)

    def __unicode__(self):
        return u"%s" % (self.name)

class CompetencesSubject(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length = 255, null=False)
    competence_subject_category = models.ForeignKey(CompetencesSubjectCategory, null=False)
    description = models.CharField(max_length = 1024, null=True, blank=True)

    def __unicode__(self):
        return u"%s - %s" % (self.competence_subject_category, self.name)

    def save(self, *args, **kwargs):
        super(CompetencesSubject, self).save(*args, **kwargs)
        team_persons = TeamPerson.objects.filter(team=self.competence_subject_category.part_of_team)
        for team_person in team_persons:
            new_comp = Competence(person=team_person.person, competence_subject=self)
            new_comp.save()

class CompetencesType(models.Model):
    id = models.AutoField(primary_key = True)
    name = models.CharField(max_length = 64, null=False)
    strength = models.IntegerField(null=False)

    def __unicode__(self):
        return u"%s" % (self.name)

class Competence(models.Model):
    id = models.AutoField(primary_key = True)
    comptype = models.ForeignKey(CompetencesType, null=True, related_name='comptype')
    target_comptype = models.ForeignKey(CompetencesType, null=True)
    person = models.ForeignKey(Person, null=False)
    competence_subject = models.ForeignKey(CompetencesSubject, null=False)

    def __unicode__(self):
        return u"%s - %s : %s -> %s" % (self.person, self.competence_subject,  self.comptype, self.target_comptype)
