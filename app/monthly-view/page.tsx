
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parse, parseISO, startOfMonth, isSameDay, startOfDay, isValid, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link'; 
import { CalendarDays, PlusCircle, MapPin, Info, Clock, Briefcase } from 'lucide-react'; 
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchMonthlyEvents, fetchWeeklyEvents, type AgendaEvent } from '@/lib/mock-db';
import { cn } from '@/lib/utils';
import { WeeklyAgendaDashboard } from '@/components/weekly-agenda-dashboard';

export default function MonthlyViewPage() {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [monthlyEvents, setMonthlyEvents] = useState<AgendaEvent[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<AgendaEvent[]>([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  const currentWeekDate = useMemo(() => new Date(), []); // Memoize to prevent re-fetching on every render

  useEffect(() => {
    setIsMonthlyLoading(true);
    fetchMonthlyEvents(month)
      .then(data => {
        setMonthlyEvents(data);
      })
      .catch(error => {
        console.error("Failed to fetch monthly events:", error);
      })
      .finally(() => {
        setIsMonthlyLoading(false);
      });
  }, [month]);

  useEffect(() => {
    setIsWeeklyLoading(true);
    fetchWeeklyEvents(currentWeekDate)
      .then(data => {
        setWeeklyEvents(data);
      })
      .catch(error => {
        console.error("Failed to fetch weekly events:", error);
      })
      .finally(() => {
        setIsWeeklyLoading(false);
      });
  }, [currentWeekDate]);


  const daysWithEvents = useMemo(() => {
    const eventDays = new Set<string>();
    monthlyEvents.forEach(event => {
        try {
             if (event.startTime && event.startTime !== 'Hora Inválida') {
                 const eventDate = parseISO(event.startTime);
                 if (isValid(eventDate)) {
                    const dayStr = format(eventDate, 'yyyy-MM-dd');
                    eventDays.add(dayStr);
                 }
             } else if (event.submissionDate && event.submissionDate !== 'Data Inválida') {
                 const subDate = parseISO(event.submissionDate);
                 if (isValid(subDate)) {
                     const dayStr = format(subDate, 'yyyy-MM-dd');
                     eventDays.add(dayStr);
                 }
             }
        } catch (e) {
            console.error(`Error parsing event start time for highlighting: ${event.startTime}`, e);
        }
    });
    return Array.from(eventDays).map(dayStr => {
        try {
           const localDate = parse(dayStr, 'yyyy-MM-dd', new Date());
           return isValid(localDate) ? startOfDay(localDate) : null;
        } catch {
            return null;
        }
    }).filter((d): d is Date => d !== null); 
  }, [monthlyEvents]);


  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return monthlyEvents.filter(event => {
        try {
            if (event.startTime === 'Hora Inválida') {
                 if (event.submissionDate !== 'Data Inválida') {
                     const subDate = parseISO(event.submissionDate);
                     return isValid(subDate) && isSameDay(subDate, selectedDay);
                 }
                 return false; 
            }
            const eventDate = parseISO(event.startTime);
            return isValid(eventDate) && isSameDay(eventDate, selectedDay);
        } catch(e) {
            console.error(`Error comparing event date with selected day: ${event.startTime}`, e);
            return false;
        }
    });
  }, [monthlyEvents, selectedDay]);

  const handleDayClick = (day: Date) => {
     setSelectedDay(day);
     if (isMobile) {
        setPopoverOpen(true); 
     } else {
        setPopoverOpen(false); 
     }
  };

   const formatTime = (isoString: string | undefined): string => {
     if (!isoString || isoString === 'Hora Inválida') return "Hora Indefinida";
     try {
        const date = parseISO(isoString);
        if (!isValid(date)) {
             console.error("Invalid date object after parsing for formatTime:", isoString);
             return "Hora Inválida";
        }
        return format(date, "HH:mm", { locale: ptBR });
     } catch (e) {
         console.error("Error formatting time:", isoString, e);
         return "Erro Hora";
     }
   }

  const modifiers = useMemo(() => ({
    eventday: daysWithEvents,
    weekend: (date: Date) => {
      const day = getDay(date);
      return day === 0 || day === 6; 
    },
  }), [daysWithEvents]);

  const modifiersClassNames = useMemo(() => ({
    eventday: 'bg-accent/50 dark:bg-accent/30 font-semibold rounded-full',
    selected: 'bg-primary text-primary-foreground rounded-full ring-2 ring-primary ring-offset-2 dark:ring-offset-background',
    today: 'bg-secondary text-secondary-foreground rounded-full font-bold',
    weekend: 'text-muted-foreground/70',
  }), []);

  const calendarStyles = useMemo(() => {
    const mobileDayCellWidth = '2rem'; // Approx 32px, for 7 days = 224px
    const desktopDayCellWidth = '2.5rem'; // Approx 40px, for 7 days = 280px

    const dayCellWidth = isMobile ? mobileDayCellWidth : desktopDayCellWidth;
    
    return {
        day: { width: dayCellWidth, height: dayCellWidth, borderRadius: '9999px', fontSize: '0.875rem' }, 
        head_cell: { width: dayCellWidth, fontWeight: '500', fontSize: '0.8rem' },
        caption_label: { fontSize: '1rem', fontWeight: '600' },
        table: { width: '100%' }, 
        root: { width: '100%'} 
    };
  }, [isMobile]);


  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      <div className="lg:w-1/3 xl:w-1/4 mb-6 lg:mb-0">
        <WeeklyAgendaDashboard events={weeklyEvents} weekDate={currentWeekDate} isLoading={isWeeklyLoading} />
      </div>
      
      <div className="lg:w-2/3 xl:w-3/4">
        <Card className="w-full shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 px-4 sm:px-6 pb-4 pt-6">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl font-bold">Calendário Mensal</CardTitle>
              <CardDescription className="text-sm sm:text-base capitalize">
                  {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row items-start px-3 sm:px-4 md:px-6 pt-4 pb-6 gap-4 sm:gap-6">
            {isMonthlyLoading ? (
              <Skeleton className="h-[380px] w-full lg:max-w-md rounded-md" />
            ) : (
              <div className="w-full lg:w-auto lg:max-w-md">
                <Popover open={popoverOpen && isMobile} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="w-full flex justify-center cursor-pointer">
                        <Calendar
                            mode="single" 
                            selected={selectedDay}
                            onDayClick={handleDayClick}
                            month={month}
                            onMonthChange={setMonth}
                            modifiers={modifiers}
                            modifiersClassNames={modifiersClassNames}
                            className="rounded-md border p-2 sm:p-3 w-full"
                            locale={ptBR}
                            showOutsideDays
                            numberOfMonths={1}
                            weekStartsOn={1} 
                            fixedWeeks
                            styles={calendarStyles}
                        />
                    </div>
                  </PopoverTrigger>
                  {isMobile && (
                    <PopoverContent
                        className="w-full max-w-xs sm:w-80 p-4 shadow-xl" 
                        side='bottom'
                        align='center'
                        sideOffset={8}
                      >
                      {selectedDay && (
                        <div>
                          <h4 className="font-semibold text-md leading-none mb-3 capitalize pb-2 border-b">
                            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </h4>
                          {eventsForSelectedDay.length > 0 ? (
                            <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {eventsForSelectedDay.map(event => (
                                <li key={event.id} className="text-sm">
                                    <Link href={`/events/${event.id}`} className="block hover:bg-accent/50 p-1.5 rounded -m-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-ring">
                                      <p className="font-medium text-foreground">{event.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        <Clock className="inline-block mr-1 h-3 w-3 align-text-bottom" />
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                      </p>
                                      {event.location && (
                                            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                                <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{event.location.split('\\n')[0]}</span>
                                            </div>
                                        )}
                                      {event.type && (
                                          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                              <Briefcase className="mr-1 h-3 w-3 flex-shrink-0" />
                                              <span>{event.type}</span>
                                          </div>
                                      )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Nenhum evento agendado para este dia.</p>
                          )}
                        </div>
                      )}
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            )}
            
            {!isMonthlyLoading && selectedDay && !isMobile && (
              <div className="hidden lg:block flex-1 p-4 border rounded-md max-h-[calc(380px+2rem+1.5rem)] overflow-y-auto">
                  <h4 className="font-semibold text-lg leading-none mb-3 capitalize pb-2 border-b">
                      {format(selectedDay, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })}
                  </h4>
                  {eventsForSelectedDay.length > 0 ? (
                      <ul className="space-y-3">
                      {eventsForSelectedDay.map(event => (
                          <li key={event.id} className="text-sm">
                            <Link href={`/events/${event.id}`} className="block hover:bg-accent/50 p-2 rounded -m-2 transition-colors focus:outline-none focus:ring-1 focus:ring-ring">
                                <p className="font-medium text-base text-foreground">{event.title}</p>
                                <p className="text-muted-foreground text-xs">
                                    <Clock className="inline-block mr-1 h-3.5 w-3.5 align-text-bottom" />
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    {event.situation && <span className="ml-2 text-xs font-medium">({event.situation})</span>}
                                </p>
                                {event.location && (
                                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                                          <MapPin className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                                          <span className="break-words">{event.location.split('\\n')[0]}</span>
                                      </div>
                                )}
                                 {event.type && (
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <Briefcase className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{event.type}</span>
                                    </div>
                                )}
                                {event.focalPoint && (
                                      <div className="flex items-start text-xs text-muted-foreground mt-1">
                                          <Info className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                          <p className="break-words">{event.focalPoint}</p>
                                      </div>
                                )}
                                {event.seiNumber && <p className="text-xs text-muted-foreground mt-1">SEI: {event.seiNumber}</p>}
                              </Link>
                          </li>
                      ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground pt-2 italic">Nenhum evento agendado para este dia.</p>
                  )}
              </div>
            )}
            {!isMonthlyLoading && !selectedDay && !isMobile && (
                <div className="hidden lg:block flex-1 p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground italic text-center pt-4">Selecione um dia no calendário para ver os detalhes.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

