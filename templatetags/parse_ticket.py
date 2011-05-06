from django.template import Library

import re

register = Library()

@register.filter
def link_ticket(value):
    """
    Returns list of urls for tickets (RT or Redmine) mentioned in @value
    """
    to_replace = re.findall("(?i)(rt ?#[\d]+|#[\d]+)", value)
    urls = []
    redmine_location = "https://intranet.fr.smartjog.net/redmine/issues/show/"
    rt_location = "https://intranet.fr.smartjog.net/rt//Ticket/Display.html?id=" 
    for ticket in to_replace:
        if re.findall("rt", ticket.lower()):
            urls.append(rt_location + ticket[ticket.find("#") + 1:])
        else:
            urls.append(redmine_location + ticket[ticket.find("#") + 1:])
    return urls

@register.filter
def get_ticket_name(value):
    """
    Returns number of ticket containing in @value plus Redmine or RT tag in consequence
    """
    ticket_number = re.findall("\d+$", value)
    if value.find("redmine") is not -1:
        return "Redmine #" + ticket_number[0]
    else:
        return "RT #" + ticket_number[0]
