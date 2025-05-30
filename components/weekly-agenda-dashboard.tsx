'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, Info, FileText, AlertTriangle } from 'lucide-react';
import type { AgendaEvent } from '@/lib/mock-db';
import { format, parseISO, isValid, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeeklyAgendaDashboardProps {
  events: AgendaEvent[];
  weekDate: Date;
  isLoading?: boolean;
}

const getSituationColorClasses = (situation?: string): string => {
    const normalizedSituation = situation?.toUpperCase().replace('REALIZADA', 'REALIZADO');
    switch (normalizedSituation) {
      case 'SOLICITADO': return 'bg-blue-100 text-blue-800 border-l-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:border-l-blue-500';
      case 'ARTICULADO': return 'bg-yellow-100 text-yellow-800 border-l-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-l-yellow-500';
      case 'REALIZADO': return 'bg-accent text-accent-foreground border-l-accent dark:border-l-accent'; // Accent color is theme-dependent
      case 'ATENDIDO': return 'bg-purple-100 text-purple-800 border-l-purple-400 dark:bg-purple-900/30 dark:text-purple-300 dark:border-l-purple-500';
      case 'CANCELADO PELO SOLICITANTE': return 'bg-red-100 text-red-800 border-l-red-400 dark:bg-red-900/30 dark:text-red-300 dark:border-l-red-500';
      default: return 'bg-muted text-muted-foreground border-l-border';
    }
  }
  
  const getSituationBorderColorClass = (situation?: string): string => {
    return getSituationColorClasses(situation).split(' ').find(cls => cls.startsWith('border-l-')) || 'border-l-gray-400 dark:border-l-gray-600';
  }
  
  const getSituationBadgeColorClasses = (situation?: string): string => {
    return getSituationColorClasses(situation).split(' ').filter(cls => !cls.startsWith('border-l-')).join(' ');
  }

export function WeeklyAgendaDashboard({ events, weekDate, isLoading }: WeeklyAgendaDashboardProps) {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  const formattedWeekRange = `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}`;

  const formatTime = (isoString: string | undefined): string => {
    if (!isoString || isoString === 'Hora Inválida') return "Hora Indefinida";
    try {
      const date = parseISO(isoString);
      return isValid(date) ? format(date, "HH:mm", { locale: ptBR }) : "Hora Inválida";
    } catch { return "Erro Hora"; }
  };
  
  const eventsByDay: Record<string, AgendaEvent[]> = {};
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    daysOfWeek.push(day);
    const dayKey = format(day, 'yyyy-MM-dd');
    eventsByDay[dayKey] = [];
  }

  events.forEach(event => {
    if (event.startTime !== 'Hora Inválida') {
      try {
        const eventDate = parseISO(event.startTime);
        if (isValid(eventDate)) {
          const dayKey = format(eventDate, 'yyyy-MM-dd');
          if (eventsByDay[dayKey]) {
            eventsByDay[dayKey].push(event);
          }
        }
      } catch (e) {
        console.error("Error processing event for weekly dashboard:", event.title, e);
      }
    }
  });


  return (
    <Card className="w-full shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-semibold">Eventos da Semana</CardTitle>
        <CardDescription className="text-sm capitalize">
          {formattedWeekRange}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 border rounded-md animate-pulse bg-muted/50">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : daysOfWeek.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[dayKey] || [];
          if (dayEvents.length === 0 && !isSameDay(day, new Date())) return null; // Optionally hide empty past/future days

          return (
            <div key={dayKey} className="mb-4 last:mb-0">
              <h4 className={cn(
                "font-semibold text-md mb-2 capitalize pb-1 border-b",
                isSameDay(day, new Date()) ? "text-primary" : "text-foreground"
              )}>
                {format(day, "EEEE, dd/MM", { locale: ptBR })}
                {isSameDay(day, new Date()) && <span className="text-xs font-normal text-primary/80"> (Hoje)</span>}
              </h4>
              {dayEvents.length > 0 ? (
                <ul className="space-y-3">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <Link href={`/events/${event.id}`} className="block group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
                        <div className={cn(
                          "p-3 border rounded-md shadow-sm group-hover:shadow-md group-hover:bg-accent/50 transition-all duration-150 ease-in-out bg-card cursor-pointer",
                          "border-l-4",
                          getSituationBorderColorClass(event.situation)
                        )}>
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-sm text-foreground group-hover:text-primary break-words">{event.title}</h5>
                            {event.situation && (
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-2",
                                    getSituationBadgeColorClasses(event.situation)
                                )}>
                                    {event.situation}
                                </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <div className="flex items-center">
                              <Clock className="mr-1.5 h-3 w-3 flex-shrink-0" />
                              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center">
                                <MapPin className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{event.location.split('\n')[0]}</span>
                              </div>
                            )}
                             {event.type && (
                                <div className="flex items-center">
                                    <CalendarDays className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                    <span>Tipo: {event.type}</span>
                                </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum evento para este dia.</p>
              )}
            </div>
          );
        })}
        {!isLoading && events.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" strokeWidth={1.5} />
            <p className="text-md font-medium">Nenhum evento encontrado para esta semana.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}