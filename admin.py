from django.contrib import admin
from workflow import models

class WorkflowAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Workflow, WorkflowAdmin)

class CategoryAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Category, CategoryAdmin)

class WorkflowInstanceAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.WorkflowInstance, WorkflowInstanceAdmin)

class ItemTemplateAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.ItemTemplate, ItemTemplateAdmin)

class ValidationAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Validation, ValidationAdmin)
