
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Info, FileText, Users, Tag, ArrowLeft, Edit, Trash2, Briefcase } from 'lucide-react'; // Added Briefcase for Type
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEventById, deleteEvent, type AgendaEvent } from '@/lib/mock-db'; 
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; 

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast(); 
  const eventId = params.id as string;
  const [event, setEvent] = useState<AgendaEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); 

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
          setEvent(data);
        } else {
          setError('Evento não encontrado.');
        }
      })
      .catch(err => {
        console.error('Erro ao buscar detalhes do evento:', err);
        setError('Erro ao carregar o evento.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eventId]);

 const formatDateTime = (isoString: string | undefined, includeTime: boolean = true): string => {
     if (!isoString || isoString === 'Hora Inválida' || isoString === 'Data Inválida') return "Data Indefinida";
     try {
       const date = parseISO(isoString);
       if (!isValid(date)) {
          console.error("Invalid date object after parsing:", isoString);
          return "Data Inválida";
       }
       const formatString = includeTime && (date.getHours() !== 0 || date.getMinutes() !== 0)
            ? "PPP 'às' HH:mm"
            : "PPP"; 

       return format(date, formatString, { locale: ptBR });
     } catch (e) {
       console.error("Error formatting date/time:", isoString, e);
       return "Erro Data";
     }
   }

   const getSituationBadgeColorClasses = (situation?: string): string => {
        const normalizedSituation = situation?.toUpperCase().replace('REALIZADA', 'REALIZADO');
        switch (normalizedSituation) {
            case 'SOLICITADO': return 'bg-accent text-accent-foreground border-accent'; // Using accent for solicitado
            case 'ARTICULADO': return 'bg-yellow-100 text-yellow-800 border-yellow-400'; // Keep yellow for articulado
            case 'REALIZADO': return 'bg-green-100 text-green-800 border-green-400'; // Keep green for realizado
            case 'ATENDIDO': return 'bg-purple-100 text-purple-800 border-purple-400'; // Keep purple for atendido
            case 'CANCELADO PELO SOLICITANTE': return 'bg-red-100 text-red-800 border-red-400'; // Keep red for cancelado
            default: return 'bg-muted text-muted-foreground border-border'; // Default fallback
        }
    }

  const handleEdit = () => {
      router.push(`/events/${eventId}/edit`); 
  };

  const handleDelete = async () => {
     setIsDeleting(true);
     try {
        const success = await deleteEvent(eventId);
        if (success) {
            toast({
              title: "Sucesso",
              description: "Evento excluído.",
            });
            router.push('/'); 
        } else {
            toast({
              title: "Erro",
              description: "Não foi possível excluir o evento. Evento não encontrado?",
              variant: "destructive",
            });
            setIsDeleting(false);
        }
     } catch (error) {
        console.error("Erro ao excluir evento:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao tentar excluir o evento.",
          variant: "destructive",
        });
        setIsDeleting(false);
     }
   };

  const handleGoBack = () => {
    // A simple check: if there's more than one entry in the history, go back.
    // Otherwise, navigate to the homepage as a fallback.
    // This handles cases where the user might have landed directly on this page.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };


  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
           <div className="flex items-center space-x-2 mb-4">
               <Skeleton className="h-6 w-6 rounded-full" />
               <Skeleton className="h-5 w-24" />
           </div>
          <Skeleton className="h-7 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-10 w-32" /> {/* For Type field */}
          <Skeleton className="h-5 w-full" />
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

  if (!event) {
    return <p>Evento não encontrado.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border border-border rounded-lg overflow-hidden">
      <CardHeader className="pb-4 border-b">
         <div className="flex items-center justify-between mb-3">
           <Button variant="outline" size="sm" onClick={handleGoBack} className="text-sm">
               <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
           </Button>
            {event.situation && (
               <span
                 className={cn(
                   "text-xs font-medium px-2.5 py-1 rounded-full",
                   getSituationBadgeColorClasses(event.situation).split(' ').filter(cls => !cls.startsWith('border-')).join(' ')
                 )}
               >
                 {event.situation}
               </span>
            )}
         </div>
        <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground leading-tight">{event.title}</CardTitle>
         <CardDescription className="text-sm text-muted-foreground pt-1">
           Detalhes do Evento/Ação
         </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

        <div className="space-y-4">
           <div className="flex items-start space-x-3">
             <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
             <div>
               <p className="text-sm font-medium text-foreground">Data do Evento</p>
               <p className="text-sm text-muted-foreground">{formatDateTime(event.startTime)} {event.startTime !== event.endTime ? ` - ${formatDateTime(event.endTime, true)}`: ''}</p>
             </div>
           </div>
            <div className="flex items-start space-x-3">
             <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
             <div>
               <p className="text-sm font-medium text-foreground">Data de Envio</p>
               <p className="text-sm text-muted-foreground">{formatDateTime(event.submissionDate, false)}</p>
             </div>
           </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Local</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.location || 'Não especificado'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Ponto Focal</p>
              <p className="text-sm text-muted-foreground">{event.focalPoint || 'Não especificado'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-start space-x-3">
             <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
             <div>
               <p className="text-sm font-medium text-foreground">Solicitante</p>
               <p className="text-sm text-muted-foreground">{event.requester || 'Não especificado'}</p>
             </div>
           </div>
            {event.type && ( // Display Type of Action
              <div className="flex items-start space-x-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Tipo de Ação</p>
                  <p className="text-sm text-muted-foreground">{event.type}</p>
                </div>
              </div>
           )}
           {event.seiNumber && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Número SEI</p>
                  <p className="text-sm text-muted-foreground break-words">{event.seiNumber}</p>
                </div>
              </div>
           )}
           {event.dailySeiNumber && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">SEI de Diárias</p>
                  <p className="text-sm text-muted-foreground break-words">{event.dailySeiNumber}</p>
                </div>
              </div>
           )}
            {event.description && (
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Descrição Adicional</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
           )}
           {event.participants && (
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Participantes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.participants}</p>
                </div>
              </div>
           )}
        </div>
      </CardContent>
       <CardFooter className="border-t p-4 sm:p-6 flex justify-end space-x-2">
           <Button variant="outline" size="sm" onClick={handleEdit} className="text-sm">
               <Edit className="mr-2 h-4 w-4" /> Editar
           </Button>
           <AlertDialog>
               <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="text-sm" disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? 'Excluindo...' : 'Excluir'}
                    </Button>
               </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                          {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
           </AlertDialog>

       </CardFooter>
    </Card>
  );
}


    
    

