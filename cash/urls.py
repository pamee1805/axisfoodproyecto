from rest_framework.routers import DefaultRouter

from .views import CajaMovimientoViewSet, CajaSessionViewSet


router = DefaultRouter()
router.register('cajas', CajaSessionViewSet, basename='caja')
router.register('movimientos-caja', CajaMovimientoViewSet, basename='movimiento-caja')

urlpatterns = router.urls
