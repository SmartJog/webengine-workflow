from django.contrib import admin
from workflow import models

class WorkflowSectionAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.WorkflowSection, WorkflowSectionAdmin)

class CategoryAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Category, CategoryAdmin)

class WorkflowAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Workflow, WorkflowAdmin)

class ItemTemplateAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.ItemTemplate, ItemTemplateAdmin)

class ValidationAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Validation, ValidationAdmin)
