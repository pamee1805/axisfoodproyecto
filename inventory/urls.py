from rest_framework.routers import DefaultRouter

from .views import InventarioMovimientoViewSet


router = DefaultRouter()
router.register(
    'inventario-movimientos',
    InventarioMovimientoViewSet,
    basename='inventario-movimiento',
)

urlpatterns = router.urls
