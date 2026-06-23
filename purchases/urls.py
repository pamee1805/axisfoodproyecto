from rest_framework.routers import DefaultRouter

from .views import CompraViewSet, ProveedorViewSet


router = DefaultRouter()
router.register('proveedores', ProveedorViewSet, basename='proveedor')
router.register('ordenes-compra', CompraViewSet, basename='orden-compra')

urlpatterns = router.urls
