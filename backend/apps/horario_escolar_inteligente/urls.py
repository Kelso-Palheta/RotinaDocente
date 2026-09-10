"""
Roteamento do App Horário Escolar Inteligente (Gestão Docente)
"""
from django.urls import path
from .apresentacao.views import (
    ValidarGradeAPIView,
    RemanejarAulaAPIView,
    ImportarPDFAPIView,
    AssistenteIAAPIView,
    CarregarGradeAPIView,
    GerarGradeAssincronaAPIView,
    StatusTaskAPIView,
    ExportarExcelAPIView,
)

urlpatterns = [
    path("validar/", ValidarGradeAPIView.as_view(), name="horario-validar"),
    path("remanejar/", RemanejarAulaAPIView.as_view(), name="horario-remanejar"),
    path("carregar/", CarregarGradeAPIView.as_view(), name="horario-carregar"),
    path("importar-pdf/", ImportarPDFAPIView.as_view(), name="horario-importar-pdf"),
    path("gerar-assincrono/", GerarGradeAssincronaAPIView.as_view(), name="horario-gerar-assincrono"),
    path("task-status/<str:task_id>/", StatusTaskAPIView.as_view(), name="horario-task-status"),
    path("exportar-excel/", ExportarExcelAPIView.as_view(), name="horario-exportar-excel"),
    path("assistente/maritaca/", AssistenteIAAPIView.as_view(), name="horario-assistente-maritaca"),
]
