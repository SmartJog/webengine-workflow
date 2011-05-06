from webengine.utils.decorators import render

from forms import AddPersonForm
from models import Person, TeamPerson, Team

@render(view='index')
def index(request):
    return {}

def team_add_competence_subject_category(request):
    pass

def team_add_competence_subject(request):
    pass

@render(view='add_person')
def team_add_person(request):
    if request.method == 'POST':
        form = AddPersonForm(request, data=request.POST)
        if form.is_valid():
        
            #contract_type_id = int(form.cleaned_data['contract_type'])
            team_id = form.cleaned_data.pop('team_id')
            newperson = Person(**form.cleaned_data)
            newperson.save()
            TeamPerson(arrival_date=newperson.arrival_date, team_id=team_id, person_id=newperson.id).save()

            return {"status" : "OK"}
        else:
            return {"status" : "KO", "error" : str(form.errors)}
    else:
        form = AddPersonForm(request)

    return {'form' : form, "status" : "NEW"}

def team_add_team_person(request):
    pass

@render(view='list_teams')
def team_list_teams(request):
    ret = {'teams' : []}
    teams = Team.objects.all()
    for team in teams:
        team_persons = TeamPerson.objects.filter(team__id=team.id)
        open("/tmp/a", "w").write(repr(team_persons))
        
        ret['teams'] += [{'team' : team, 'persons' : reduce(lambda persons, team_person: persons+ [team_person.person], team_persons, [])}]
    return ret

def team_add_team_person(request):
    pass
