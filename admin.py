from django.contrib import admin
from workflow import models

class WorkflowAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Workflow, WorkflowAdmin)

class WorkflowCategoryAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.WorkflowCategory, WorkflowCategoryAdmin)

class WorkflowInstanceAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.WorkflowInstance, WorkflowInstanceAdmin)

class ItemAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Item, ItemAdmin)

class ValidationAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.Validation, ValidationAdmin)

class WorkflowInstanceItemsAdmin(admin.ModelAdmin):
    pass
admin.site.register(models.WorkflowInstanceItems, WorkflowInstanceItemsAdmin)

