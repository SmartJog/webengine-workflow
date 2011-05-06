# -*- coding: utf-8 -*-

from django import forms
from django.utils.translation import ugettext_lazy as _
import re

from team.models import *

def get_contract_types():
    return reduce(lambda all_contract_type, contract_type: all_contract_type + [[contract_type.id, contract_type]], ContractType.objects.all(), [])

def get_teams():
    return reduce(lambda all_teams, team: all_teams + [[team.id, team]], Team.objects.all(), [])

class AddPersonForm(forms.Form):
    def __init__(self, request, *args, **kwargs):
        super(AddPersonForm, self).__init__(*args, **kwargs)

        self.request = request
        self.fields['firstname']      = forms.CharField(label="Firstname")
        self.fields['lastname']       = forms.CharField(label="Lastname")
        self.fields['arrival_date']   = forms.DateField(label="Arrival date")
        self.fields['departure_date'] = forms.DateField(label="Departure date", required=False)
        self.fields['access_card']    = forms.CharField(label="Access card")
        self.fields['token_serial']   = forms.CharField(label="Token serial")
        self.fields['phone_number']   = forms.CharField(label="Phone number")
        self.fields['contract_type_id'] = forms.ChoiceField(label="Contract", choices=get_contract_types())
        self.fields['team_id']          = forms.ChoiceField(label="Team", choices=get_teams())
