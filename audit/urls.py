from rest_framework.routers import DefaultRouter

from .views import AuditLogViewSet


router = DefaultRouter()
router.register('auditoria', AuditLogViewSet, basename='auditoria')

urlpatterns = router.urls
