"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getEventById, updateEvent, type AgendaEvent, situationOptions, actionTypes as availableActionTypes } from '@/lib/mock-db';
import { ArrowLeft } from 'lucide-react';
import { parseISO, isValid } from 'date-fns';

const editActionSchema = z.object({
  seiNumber: z.string().optional(),
  submissionDate: z.date({
    required_error: "Data de envio é obrigatória.",
  }).nullable(), 
  subject: z.string().min(1, "Assunto é obrigatório"),
  type: z.string({ 
    required_error: "Tipo de ação é obrigatório.",
  }).min(1, "Tipo de ação é obrigatório."),
  requester: z.string().min(1, "Solicitante é obrigatório"),
  location: z.string().min(1, "Local é obrigatório"),
  focalPoint: z.string().min(1, "Ponto focal é obrigatório"),
  eventDate: z.date({
    required_error: "Data do evento é obrigatória.",
  }).nullable(), 
  situation: z.string({
    required_error: "Situação é obrigatória.",
  }).min(1, "Situação é obrigatória."),
  dailySeiNumber: z.string().optional(),
  description: z.string().optional(),
  participants: z.string().optional(),
});

type EditActionFormValues = z.infer<typeof editActionSchema>;

export default function EditEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditActionFormValues>({
    resolver: zodResolver(editActionSchema),
    defaultValues: {
        seiNumber: "",
        submissionDate: null,
        subject: "",
        type: availableActionTypes[0] || "", 
        requester: "",
        location: "",
        focalPoint: "",
        eventDate: null,
        situation: "SOLICITADO", 
        dailySeiNumber: "",
        description: "",
        participants: "",
    },
  });

  useEffect(() => {
    if (!eventId) {
      setError('ID do evento não fornecido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getEventById(eventId)
      .then(data => {
        if (data) {
           let submissionDateValue: Date | null = null;
           let eventDateValue: Date | null = null;
           try {
               if (data.submissionDate && data.submissionDate !== 'Data Inválida') {
                   const parsed = parseISO(data.submissionDate);
                   if (isValid(parsed)) submissionDateValue = parsed;
               }
            } catch (e) {
              console.error("Error parsing submissionDate from DB:", data.submissionDate, e);
            }
            try {
               if (data.startTime && data.startTime !== 'Hora Inválida') { 
                   const parsed = parseISO(data.startTime);
                    if (isValid(parsed)) eventDateValue = parsed;
               }
           } catch (e) {
              console.error("Error parsing eventDate (startTime) from DB:", data.startTime, e);
           }

          form.reset({
            seiNumber: data.seiNumber || "",
            submissionDate: submissionDateValue,
            subject: data.title || "",
            type: data.type || availableActionTypes[0] || "",
            requester: data.requester || "",
            location: data.location || "",
            focalPoint: data.focalPoint || "",
            eventDate: eventDateValue,
            situation: data.situation || "SOLICITADO",
            dailySeiNumber: data.dailySeiNumber || "",
            description: data.description || "",
            participants: data.participants || "",
          });
        } else {
          setError('Evento não encontrado.');
        }
      })
      .catch(err => {
        console.error('Erro ao buscar evento para edição:', err);
        setError('Erro ao carregar dados do evento.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eventId, form]); 

  const onSubmit = async (formData: EditActionFormValues) => {
    // formData.submissionDate and formData.eventDate are Date | null
    if (!formData.submissionDate || !formData.eventDate) {
       toast({
           title: "Erro de Validação",
           description: "Datas de envio e evento são obrigatórias.",
           variant: "destructive",
        });
       return;
    }

    try {
       // The updateEvent function expects Date objects for submissionDate and eventDate if they are being updated.
       // It will handle the conversion to ISO strings internally.
       const eventDataToUpdate = {
         title: formData.subject,
         type: formData.type,
         requester: formData.requester,
         location: formData.location,
         focalPoint: formData.focalPoint,
         situation: formData.situation,
         seiNumber: formData.seiNumber,
         dailySeiNumber: formData.dailySeiNumber,
         description: formData.description,
         participants: formData.participants,
         submissionDate: formData.submissionDate, // Pass as Date | null
         eventDate: formData.eventDate,       // Pass as Date | null
       };

      const updatedEvent = await updateEvent(eventId, eventDataToUpdate);

      if (updatedEvent) {
        toast({
          title: "Ação Atualizada com Sucesso",
          description: `A ação "${updatedEvent.title}" (${updatedEvent.type}) foi atualizada.`,
        });
        router.push(`/events/${eventId}`); 
      } else {
         toast({
             title: "Erro ao Atualizar",
             description: "Não foi possível encontrar o evento para atualizar.",
             variant: "destructive",
         });
      }
    } catch (error) {
      console.error("Erro ao atualizar ação:", error);
      toast({
        title: "Erro ao Atualizar",
        description: "Ocorreu um erro ao tentar atualizar a ação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onCancel = () => {
    router.push(`/events/${eventId}`);
  };

   if (isLoading) {
     return (
       <Card className="w-full max-w-3xl mx-auto shadow-lg">
         <CardHeader>
            <Skeleton className="h-7 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
         </CardHeader>
         <CardContent className="space-y-8 pt-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
              <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" /> 
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
             <div className="flex justify-end gap-2">
                <Skeleton className="h-11 w-24" />
                <Skeleton className="h-11 w-32" />
             </div>
         </CardContent>
       </Card>
     );
   }

   if (error) {
     return (
       <Card className="w-full max-w-xl mx-auto shadow-lg text-center">
         <CardHeader>
           <CardTitle className="text-destructive">Erro</CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">{error}</p>
           <Button variant="outline" size="sm" asChild className="mt-4" onClick={() => router.push('/')}>
              <a href="/" > 
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Home
              </a>
           </Button>
         </CardContent>
       </Card>
     );
   }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Editar Ação</CardTitle>
        <CardDescription>Atualize os detalhes da ação.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="seiNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do SEI</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12345.678901/2023-12" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="submissionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Envio</FormLabel>
                    <DatePicker
                      date={field.value || undefined} 
                      setDate={(dateValue) => field.onChange(dateValue ?? null)} 
                      placeholder="Selecione a data de envio"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Assunto</FormLabel>
                    <FormControl>
                        <Input placeholder="Assunto da ação" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo de Ação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de ação" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableActionTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                {type}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="requester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do solicitante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Local do evento/ação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="focalPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponto Focal</FormLabel>
                    <FormControl>
                      <Input placeholder="Responsável principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Evento</FormLabel>
                    <DatePicker
                      date={field.value || undefined} 
                      setDate={(dateValue) => field.onChange(dateValue ?? null)}
                      placeholder="Selecione a data do evento"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="situation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a situação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {situationOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dailySeiNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEI de Solicitação das Diárias</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do SEI para diárias (opcional)" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre a ação (opcional)"
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participantes</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomes ou emails, separados por vírgula (opcional)" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    Separe múltiplos participantes por vírgula.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">Salvar Alterações</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


