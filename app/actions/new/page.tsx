
"use client";

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
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // Import useRouter
import { addEvent, actionTypes as availableActionTypes } from '@/lib/mock-db'; // Import actionTypes


const actionSchema = z.object({
  seiNumber: z.string().optional(), 
  submissionDate: z.date({
    required_error: "Data de envio é obrigatória.",
  }),
  subject: z.string().min(1, "Assunto é obrigatório"),
  type: z.string({ // Added type field
    required_error: "Tipo de ação é obrigatório.",
  }).min(1, "Tipo de ação é obrigatório."),
  requester: z.string().min(1, "Solicitante é obrigatório"),
  location: z.string().min(1, "Local é obrigatório"),
  focalPoint: z.string().min(1, "Ponto focal é obrigatório"),
  eventDate: z.date({
    required_error: "Data do evento é obrigatória.",
  }),
  situation: z.string({
    required_error: "Situação é obrigatória.",
  }).min(1, "Situação é obrigatória."),
  dailySeiNumber: z.string().optional(),
  description: z.string().optional(), 
  participants: z.string().optional(), 
});

type ActionFormValues = z.infer<typeof actionSchema>;

const situationOptions = [
    "ARTICULADO",
    "SOLICITADO",
    "REALIZADO",
    "CANCELADO PELO SOLICITANTE",
    "ATENDIDO",
];


export default function NewActionPage() {
  const { toast } = useToast();
  const router = useRouter(); 
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      seiNumber: "",
      subject: "", 
      type: availableActionTypes[0] || "", // Default to first action type or empty
      requester: "",
      location: "",
      focalPoint: "",
      dailySeiNumber: "",
      description: "",
      participants: "",
      situation: "SOLICITADO", 
    },
  });

   const onSubmit = async (data: ActionFormValues) => {
     try {
       const eventData = {
         title: data.subject, 
         type: data.type, // Pass type
         requester: data.requester,
         location: data.location,
         focalPoint: data.focalPoint,
         situation: data.situation,
         seiNumber: data.seiNumber,
         dailySeiNumber: data.dailySeiNumber,
         description: data.description,
         participants: data.participants,
         submissionDate: data.submissionDate, 
         eventDate: data.eventDate,       
       };

       const newEvent = await addEvent(eventData);

       toast({
         title: "Ação Salva com Sucesso",
         description: `A ação "${newEvent.title}" (${newEvent.type}) foi cadastrada.`,
       });
       router.push('/'); 
     } catch (error) {
        console.error("Erro ao salvar ação:", error);
        toast({
           title: "Erro ao Salvar",
           description: "Ocorreu um erro ao tentar salvar a ação. Tente novamente.",
           variant: "destructive",
        });
     }
   };

   const onCancel = () => {
     form.reset(); 
     toast({
       title: "Cancelado",
       description: "Criação de nova ação cancelada.",
       variant: "default",
     });
     router.push('/'); 
   };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Cadastrar Nova Ação</CardTitle>
        <CardDescription>Preencha os detalhes da nova ação.</CardDescription>
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
                       <Input placeholder="Ex: 12345.678901/2023-12" {...field} />
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
                      date={field.value}
                      setDate={field.onChange}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          date={field.value}
                          setDate={field.onChange}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                       <Input placeholder="Número do SEI para diárias (opcional)" {...field} />
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
                        <Input placeholder="Nomes ou emails, separados por vírgula (opcional)" {...field} />
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
              <Button type="submit" className="w-full sm:w-auto">Salvar Ação</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

