from datetime import timedelta
from django.db import transaction
from .models import AulaAgendada, EventoCalendario, GradeHoraria

class SmartShiftService:
    """
    Engine de Remanejamento Inteligente (Smart Shift) do Gestão Docente.
    Desloca automaticamente as aulas em cascata preservando a sequencia da ementa
    e pulando feriados e recessos cadastrados no banco.
    """

    @classmethod
    @transaction.atomic
    def remanejar_aulas_em_cascata(cls, turma, data_cancelada, motivo="Cancelamento Imprevisto"):
        # 1. Busca todas as aulas da turma a partir da data cancelada que ainda nao foram lecionadas
        aulas_futuras = list(AulaAgendada.objects.filter(
            turma=turma,
            data__gte=data_cancelada,
            status__in=['prevista', 'remanejada']
        ).order_by('data', 'horario_inicio'))

        if not aulas_futuras:
            return 0

        # Marca a aula da data_cancelada como cancelada ou remanejada
        aula_origem = aulas_futuras[0]
        aula_origem.status = 'remanejada'
        aula_origem.motivo_remanejamento = motivo
        aula_origem.save()

        # Grade de dias da semana da turma
        grades = list(GradeHoraria.objects.filter(turma=turma).order_by('dia_semana', 'horario_inicio'))
        if not grades:
            # Se nao tiver grade cadastrada, avanca por padrão 7 dias
            dias_permitidos = [aula_origem.data.isoweekday()]
        else:
            dias_permitidos = [g.dia_semana for g in grades]

        # Busca feriados e eventos que bloqueiam aulas
        eventos_bloqueantes = set(EventoCalendario.objects.filter(
            data__gte=data_cancelada,
            bloqueia_aulas=True
        ).values_list('data', flat=True))

        # Encontra proximas datas validas e desloca os temas
        data_cursor = data_cancelada + timedelta(days=1)
        aulas_modificadas = 0

        for aula in aulas_futuras:
            # Procura o proximo dia letivo valido
            while True:
                dia_semana_iso = data_cursor.isoweekday()
                if dia_semana_iso in dias_permitidos and data_cursor not in eventos_bloqueantes:
                    break
                data_cursor += timedelta(days=1)

            # Atualiza a data da aula
            aula.data = data_cursor
            aula.status = 'remanejada'
            aula.motivo_remanejamento = f"Deslocado pelo Smart Shift devido a: {motivo}"
            aula.save()
            aulas_modificadas += 1

            # Avanca o cursor para a proxima aula
            data_cursor += timedelta(days=1)

        return aulas_modificadas
