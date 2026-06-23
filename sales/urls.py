from rest_framework.routers import DefaultRouter

from .views import ClienteViewSet, PagoViewSet, PedidoViewSet


router = DefaultRouter()
router.register('clientes', ClienteViewSet, basename='cliente')
router.register('pedidos', PedidoViewSet, basename='pedido')
router.register('pagos', PagoViewSet, basename='pago')

urlpatterns = router.urls
