
export async function insertAllAgendaEvents(events: AgendaEvent[]) {
  const formattedEvents = events.map((event) => ({
    id: event.id,
    sei_number: event.seiNumber || null,
    submission_date: event.submissionDate,
    title: event.title,
    requester: event.requester,
    location: event.location,
    focal_point: event.focalPoint,
    start_time: event.startTime,
    end_time: event.endTime,
    situation: event.situation || null,
    daily_sei_number: event.dailySeiNumber || null,
    description: event.description || null,
    participants: event.participants || null,
    type: event.type || null,
  }));

  const { data, error } = await supabase
    .from('agenda_events')
    .insert(formattedEvents);

  if (error) {
    console.error('Erro ao inserir dados:', error.message);
    return;
  }

  console.log('Eventos inseridos com sucesso:', data);
}
