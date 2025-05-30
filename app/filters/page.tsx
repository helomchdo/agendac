
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { fetchFilteredEvents, type AgendaEvent, situationOptions, actionTypes, type FilterCriteria } from '@/lib/mock-db';
import { Search, FileDown, CalendarDays, Tag, User, Info, Clock, MapPin, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MAX_RECENT_SEARCHES = 5;

const filterFieldOptions = [
  { value: "seiNumber", label: "Número SEI" },
  { value: "actionType", label: "Tipo de Ação" },
  { value: "dateRange", label: "Período (Data)" },
  { value: "situation", label: "Situação" },
  { value: "focalPoint", label: "Ponto Focal" },
  { value: "location", label: "Local" },
] as const;

type FilterFieldType = typeof filterFieldOptions[number]['value'];

const filterSchema = z.object({
  filterField: z.enum(filterFieldOptions.map(opt => opt.value) as [FilterFieldType, ...FilterFieldType[]]).default("seiNumber"),
  seiFieldValue: z.string().optional(),
  actionTypeFieldValue: z.string().optional(),
  startDateFieldValue: z.date().optional().nullable(),
  endDateFieldValue: z.date().optional().nullable(),
  situationFieldValue: z.string().optional(),
  focalPointFieldValue: z.string().optional(),
  locationFieldValue: z.string().optional(),
}).refine(data => {
    if (data.filterField === 'dateRange' && data.startDateFieldValue && data.endDateFieldValue && data.startDateFieldValue > data.endDateFieldValue) {
        return false;
    }
    return true;
}, {
    message: "Data final deve ser após a data inicial.",
    path: ["endDateFieldValue"],
});

type FilterFormValues = z.infer<typeof filterSchema>;

export default function AdvancedFiltersPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<AgendaEvent[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      filterField: "seiNumber",
      seiFieldValue: "",
      actionTypeFieldValue: "TODOS",
      startDateFieldValue: null,
      endDateFieldValue: null,
      situationFieldValue: "TODAS",
      focalPointFieldValue: "",
      locationFieldValue: "",
    },
  });

  const watchedFilterField = form.watch("filterField");

  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSeiSearches');
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches));
    }
  }, []);

  const handleSeiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 5) value = `${value.slice(0, 5)}.${value.slice(5)}`;
    if (value.length > 12) value = `${value.slice(0, 12)}/${value.slice(12)}`;
    if (value.length > 17) value = `${value.slice(0, 17)}-${value.slice(17)}`;
    form.setValue("seiFieldValue", value.slice(0, 20));
  };

  const addRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const updatedSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSeiSearches', JSON.stringify(updatedSearches));
  };

  const onSubmit = async (data: FilterFormValues) => {
    setIsLoading(true);
    setSearchResults([]);
    const criteria: FilterCriteria = {};

    switch (data.filterField) {
      case 'seiNumber':
        criteria.seiNumber = data.seiFieldValue;
        if (data.seiFieldValue) addRecentSearch(data.seiFieldValue);
        break;
      case 'actionType':
        criteria.actionType = data.actionTypeFieldValue === "TODOS" ? undefined : data.actionTypeFieldValue;
        break;
      case 'dateRange':
        criteria.startDate = data.startDateFieldValue || undefined;
        criteria.endDate = data.endDateFieldValue || undefined;
        break;
      case 'situation':
        criteria.situation = data.situationFieldValue === "TODAS" ? undefined : data.situationFieldValue;
        break;
      case 'focalPoint':
        criteria.focalPoint = data.focalPointFieldValue;
        break;
      case 'location':
        criteria.location = data.locationFieldValue;
        break;
    }

    try {
      const results = await fetchFilteredEvents(criteria);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
            title: "Nenhum Resultado",
            description: "Nenhum evento encontrado com os filtros aplicados.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      toast({
        title: "Erro na Busca",
        description: "Ocorreu um erro ao buscar os eventos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string | undefined): string => {
    if (!isoString || isoString === 'Hora Inválida') return "Hora Indefinida";
    try {
      const date = parseISO(isoString);
      return isValid(date) ? format(date, "HH:mm", { locale: ptBR }) : "Hora Inválida";
    } catch (e) { return "Erro Hora"; }
  };

  const getSituationBadgeColorClasses = (situation?: string): string => {
    const normalizedSituation = situation?.toUpperCase().replace('REALIZADA', 'REALIZADO');
    switch (normalizedSituation) {
      case 'SOLICITADO': return 'bg-blue-100 text-blue-800 border-l-blue-400';
      case 'ARTICULADO': return 'bg-yellow-100 text-yellow-800 border-l-yellow-400';
      case 'REALIZADO': return 'bg-accent text-accent-foreground border-l-accent';
      case 'ATENDIDO': return 'bg-purple-100 text-purple-800 border-l-purple-400';
      case 'CANCELADO PELO SOLICITANTE': return 'bg-red-100 text-red-800 border-l-red-400';
      default: return 'bg-gray-100 text-gray-800 border-l-gray-400';
    }
  }

  const handleExport = (formatType: 'pdf' | 'excel') => {
    toast({
        title: `Exportar para ${formatType.toUpperCase()}`,
        description: "Funcionalidade de exportação ainda não implementada.",
    });
    console.log("Export results to", formatType, searchResults);
  };


  return (
    <div className="space-y-6">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Filtros Avançados de Ações</CardTitle>
          <CardDescription>Escolha um critério e busque por eventos e ações.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="filterField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Filtro</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de filtro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filterFieldOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedFilterField === "seiNumber" && (
                <FormField
                  control={form.control}
                  name="seiFieldValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do SEI</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000.000000/0000-00"
                          {...field}
                          onChange={handleSeiChange}
                          value={field.value || ''}
                          list="recent-sei-searches"
                        />
                      </FormControl>
                      {recentSearches.length > 0 && (
                        <datalist id="recent-sei-searches">
                          {recentSearches.map(search => <option key={search} value={search} />)}
                        </datalist>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedFilterField === "actionType" && (
                <FormField
                  control={form.control}
                  name="actionTypeFieldValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TODOS">TODOS OS TIPOS</SelectItem>
                          {actionTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedFilterField === "dateRange" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDateFieldValue"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Inicial</FormLabel>
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                          placeholder="DD/MM/AAAA"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDateFieldValue"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Final</FormLabel>
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                          placeholder="DD/MM/AAAA"
                          disabled={(date) => form.getValues("startDateFieldValue") ? date < form.getValues("startDateFieldValue")! : false}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {watchedFilterField === "situation" && (
                <FormField
                  control={form.control}
                  name="situationFieldValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TODAS">TODAS AS SITUAÇÕES</SelectItem>
                          {situationOptions.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedFilterField === "focalPoint" && (
                <FormField
                  control={form.control}
                  name="focalPointFieldValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto Focal</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedFilterField === "location" && (
                <FormField
                  control={form.control}
                  name="locationFieldValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o local" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? "Buscando..." : "Buscar Ações"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(isLoading || searchResults.length > 0) && (
        <Card className="w-full shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-xl">Resultados da Busca</CardTitle>
                {!isLoading && <CardDescription>{searchResults.length} evento(s) encontrado(s).</CardDescription>}
            </div>
            {searchResults.length > 0 && !isLoading && (
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                        <FileDown className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                        <FileDown className="mr-2 h-4 w-4" /> Excel
                    </Button>
                </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-20 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-4">
                {searchResults.map((event) => (
                  <li key={event.id}>
                     <Link href={`/events/${event.id}`} className="block group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
                        <div className={cn("flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-6 p-4 border rounded-lg shadow-sm group-hover:shadow-md transition-all duration-150 ease-in-out bg-card cursor-pointer border-l-4", getSituationBadgeColorClasses(event.situation).split(' ')[2])}>
                            <div className="flex flex-row sm:flex-col items-center sm:items-start sm:justify-start text-center sm:text-left w-full sm:w-28 flex-shrink-0 space-x-2 sm:space-x-0 sm:space-y-1 pt-1">
                                <CalendarDays className="h-4 w-4 text-muted-foreground sm:self-center" />
                                <div className="flex flex-col items-center flex-grow sm:flex-grow-0">
                                    <span className="text-sm font-semibold text-primary">
                                        {event.startTime !== 'Hora Inválida' ? format(parseISO(event.startTime), "dd/MM/yy", { locale: ptBR }) : "N/A"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    </span>
                                </div>
                                {event.situation && (
                                    <span className={cn("hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 self-center", getSituationBadgeColorClasses(event.situation).split(' ').slice(0,2).join(' '))}>
                                    {event.situation}
                                    </span>
                                )}
                            </div>
                             <div className="w-full border-t border-border sm:hidden"></div>
                             <div className="flex-1 space-y-1 min-w-0">
                                <h3 className="font-semibold text-base leading-snug text-foreground break-words group-hover:text-primary">{event.title}</h3>
                                {event.type && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Tag className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                        <span>{event.type}</span>
                                    </div>
                                )}
                                {event.location && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{event.location.split('\n')[0]}</span>
                                    </div>
                                )}
                                {event.focalPoint && (
                                    <div className="flex items-start text-sm text-muted-foreground">
                                    <User className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <p className="break-words">{event.focalPoint}</p>
                                    </div>
                                )}
                                {event.seiNumber && (
                                    <div className="flex items-center text-xs text-muted-foreground pt-0.5">
                                        <FileText className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                        <span>SEI: {event.seiNumber.split(',')[0]}</span>
                                    </div>
                                )}
                                {event.situation && (
                                    <span className={cn("sm:hidden inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1.5", getSituationBadgeColorClasses(event.situation).split(' ').slice(0,2).join(' '))}>
                                    {event.situation}
                                    </span>
                                )}
                             </div>
                        </div>
                     </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
