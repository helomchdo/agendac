
import { addMonths, parse, formatISO, startOfDay, endOfDay, isWithinInterval, parseISO, startOfMonth, endOfMonth, compareAsc, isValid, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Define the structure for an agenda event
export interface AgendaEvent {
  id: string;
  seiNumber?: string; // Optional SEI number
  submissionDate: string; // ISO string date or placeholder if invalid
  title: string; // "Assunto"
  requester: string; // "Solicitante"
  location: string; // "Local"
  focalPoint: string; // "Ponto Focal"
  startTime: string; // Combined date and start time (ISO string) or placeholder
  endTime: string; // Combined date and end time (ISO string) or placeholder
  situation?: string; // "Situação"
  dailySeiNumber?: string; // Optional SEI for daily allowance
  description?: string; // Optional description
  participants?: string; // Optional participants list (string)
  type?: string; // Type of action, e.g., "REUNIÃO", "EVENTO", "JPS"
}

// Export situation options
export const situationOptions = [
    "ARTICULADO",
    "SOLICITADO",
    "REALIZADO",
    "CANCELADO PELO SOLICITANTE",
    "ATENDIDO",
];

// Export action types for filters
export const actionTypes = [
    "JPS",
    "JPE",
    "REUNIÃO",
    "EVENTO EXTERNO",
    "EVENTO INTERNO",
    "CAPACITAÇÃO",
    "FISCALIZAÇÃO",
    "ATENDIMENTO JURÍDICO",
    "PALESTRA",
    "AÇÃO DE GOVERNO",
    "OUTRO",
];


// Helper function to generate unique IDs (simple version)
function generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// Helper to parse varied date strings (including ranges and 'A definir')
function parseDateString(dateStr: string, referenceYear: number, referenceMonth: number): { start: Date | null, end: Date | null } {
    dateStr = dateStr.trim();
    if (/a definir|preferencialmente|entre os dias/i.test(dateStr)) {
        const monthYearMatch = dateStr.match(/^(?:Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/(\d{2,4})/i);
        if (monthYearMatch) {
             const year = parseInt(monthYearMatch[1], 10);
             const monthName = dateStr.split('/')[0];
             // Ensure ptBR.localize and month are defined before calling findIndex
             const monthIndex = ptBR.localize?.month && typeof ptBR.localize.month === 'function' ? 
                [0,1,2,3,4,5,6,7,8,9,10,11].findIndex(i => ptBR.localize!.month(i, { width: 'abbreviated' })?.toLowerCase().startsWith(monthName.toLowerCase().substring(0,3)))
                : -1;
             if (monthIndex !== -1) {
                 try {
                    const approxDate = new Date(year < 100 ? 2000 + year : year, monthIndex, 15); // Use 15th as a fallback day
                    if(isValid(approxDate)) return { start: approxDate, end: approxDate }; 
                 } catch {}
             }
        }
        return { start: null, end: null }; 
    }

    try {
        let parsedSimple = parse(dateStr, 'dd/MM/yyyy', new Date());
         if (!isValid(parsedSimple)) parsedSimple = parse(dateStr, 'yyyy-MM-dd', new Date());
         if (!isValid(parsedSimple)) parsedSimple = parse(dateStr, "yyyy-MM-dd'T'HH:mm:ss", new Date());
         if (!isValid(parsedSimple)) parsedSimple = parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());

        if (isValid(parsedSimple)) {
             if (!/\d{4}/.test(dateStr) && dateStr.includes('/')) {
                parsedSimple.setFullYear(referenceYear);
             }
            return { start: parsedSimple, end: parsedSimple };
        }
    } catch (e) { /* Ignore */ }

    const rangeMatch = dateStr.match(/^(?:(\d{1,2})\s*(?:,|e|\s|a)*)*(\d{1,2})\s*(?:de|\/)\s*([a-zA-Z\d]{1,2})\s*(?:(?:de|\/)\s*(\d{4}))?$/i);
    if (rangeMatch) {
        const parts = dateStr.split(/[\s,e\/a]|de/i).filter(p => p.length > 0);
        const days = parts.filter(part => /^\d{1,2}$/.test(part)).map(d => parseInt(d, 10));
        const monthStr = parts.find(part => !/^\d+$/.test(part) && /[a-zA-Z\d]{1,2}/.test(part));
        const yearStr = parts.find(part => /^\d{4}$/.test(part));

        if (days.length >= 1 && monthStr) {
            const startDay = days[0];
            const endDay = days.length > 1 ? days[days.length - 1] : startDay;
             let specifiedYear = yearStr ? parseInt(yearStr, 10) : referenceYear;
             if (yearStr && yearStr.length === 2) specifiedYear = 2000 + parseInt(yearStr, 10);

            let monthIndex: number;
            if (isNaN(parseInt(monthStr, 10))) {
                const monthLower = monthStr.toLowerCase().substring(0,3);
                 monthIndex = ptBR.localize?.month && typeof ptBR.localize.month === 'function' ?
                    [0,1,2,3,4,5,6,7,8,9,10,11].findIndex(i => ptBR.localize!.month(i, { width: 'abbreviated' })?.toLowerCase().startsWith(monthLower))
                    : -1;
                 if (monthIndex === -1) monthIndex = referenceMonth;
            } else {
                monthIndex = parseInt(monthStr, 10) - 1;
            }

             if (!isNaN(startDay) && !isNaN(endDay) && monthIndex >= 0 && monthIndex < 12) {
                 try {
                    const startDate = new Date(specifiedYear, monthIndex, startDay);
                    const endDate = new Date(specifiedYear, monthIndex, endDay);
                    if (isValid(startDate) && isValid(endDate)) return { start: startDate, end: endDate };
                 } catch (e) { console.error(`Error parsing range date: ${dateStr}`, e); }
            }
        }
    }

     const monthYearMatchDefinir = dateStr.match(/^([a-zA-Z]+)\s*(?:de|\/)\s*(\d{2,4})(?:\s+A definir)?$/i);
    if (monthYearMatchDefinir) {
         const year = parseInt(monthYearMatchDefinir[2], 10);
         const monthName = monthYearMatchDefinir[1];
         const monthIndex = ptBR.localize?.month && typeof ptBR.localize.month === 'function' ?
            [0,1,2,3,4,5,6,7,8,9,10,11].findIndex(i => ptBR.localize!.month(i, { width: 'abbreviated' })?.toLowerCase().startsWith(monthName.toLowerCase().substring(0,3)))
            : -1;

         if (monthIndex !== -1) {
            try {
                 const approxDate = new Date(year < 100 ? 2000 + year : year, monthIndex, 15); // Use 15th as a fallback day
                 if(isValid(approxDate)) return { start: approxDate, end: approxDate };
            } catch {}
         }
        return { start: null, end: null };
    }

    console.warn(`Could not parse event date string: ${dateStr}. Returning null.`);
    return { start: null, end: null };
}

const DEFAULT_START_TIME = '08:00';
const DEFAULT_END_TIME = '17:00';

const rawEventsData = [
  // JANEIRO 2025
  { sei: '3900009117.003009/2024-13', envio: '2024-12-10 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Bom Sucesso Futebol Clube', local: 'Rua Maragogi, 133 - Alto José do Pinho - Recife/PE', pontoFocal: "Marcílio Batista 81 98879.9456 / 99695.6444", data: 'Janeiro/2025 A definir', situacao: 'SOLICITADO', seiDiarias: 'Não atendido' },
  { sei: '1900000122.000030/2025-70', envio: '2025-01-23 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Secretária de Justiça, Direitos Humanos e Prevenção à Violência', local: 'Auditório do 3° andar do Empresarial Palmira II, localizado na Av. Conde da Boa Vista, 1410, bairro da Boa Vista, Recife - PE.', pontoFocal: "JOANA D'ARC DA SILVA FIGUEIRÊDO", data: '2025-01-29 00:00:00', situacao: 'ATENDIDO', seiDiarias: '3900000034.000548/2025-19' },
  // FEVEREIRO 2025
  { sei: '3900032430.000048/2025-09', envio: '2025-02-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'PMPE (20º BPM)', local: 'Sede do 20º BPM', pontoFocal: 'Major Ferraz F. 3181-3583', data: '2025-02-12 00:00:00', situacao: 'ATENDIDO', seiDiarias: '3900000034.000792/2025-81' },
  { sei: 'AÇÃO DE GOVERNO', envio: '-', assunto: 'Solicita JPS', type: 'AÇÃO DE GOVERNO', solicitante: 'Secretária de Justiça, Direitos Humanos e Prevenção à Violência', local: 'Vicência (Vitimas das chuvas)', pontoFocal: 'Escola Municipal Luiz Maranhão', data: '2025-02-14 00:00:00', situacao: 'ATENDIDO', seiDiarias: '3900000034.000840/2025-31' },
  { sei: '3900009117.000156/2025-51', envio: '2025-01-21 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Igreja Assembleia de DEUS', local: 'Escola Estadual EREM Professora Helena Pugó, Rua 15 de Março, s/n, Bongi, Recife/PE', pontoFocal: 'Pastor Alexsandro Santos 81 98958.3600 / Rayana Gomes Gestora da Escola 8198882.1516', data: '2025-02-15 00:00:00', situacao: 'ATENDIDO', seiDiarias: '3900000034.000846/2025-17' },
  { sei: '3900009117.000037/2025-51', envio: '2025-01-07 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'União de Dois Unidos', local: 'Sede da União de Dois Unidos, Rua Vinte e Um de Junho, 580 - Dois Unidos - Recife/PE', pontoFocal: 'Marcílio Batista 81 98879.9456 / 99695.6444', data: 'Fevereiro/25 A definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000165/2025-03', envio: '2025-01-22 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Prefeitura de Cedro', local: 'Secretaria de Assistência Social', pontoFocal: 'Mércia Bem Elias 87 99609.4807 / 99821.2740', data: '19 a 22/02/2025', situacao: 'ARTICULADO', seiDiarias: '3900000034.000928/2025-53\n3900000034.000950/2025-01' },
  { sei: '3900009117.000163/2025-14', envio: '2025-01-22 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Câmara Municipal de Tuparetama', local: 'Local a definir', pontoFocal: 'Vanda Lúcia Cavalcante Silvestre 87 3828.1148', data: 'A definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000186/2025-11', envio: '2025-01-27 00:00:00', assunto: 'Solicita JPE', type: 'JPE', solicitante: 'Prefeitura Tuparetama', local: 'TUPARETAMA', pontoFocal: 'A DEFINIR', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: 'AÇÃO DE GOVERNO', envio: '-', assunto: 'Solicita JPS', type: 'AÇÃO DE GOVERNO', solicitante: 'Secretária de Justiça, Direitos Humanos e Prevenção à Violência', local: 'Petrolina', pontoFocal: 'Localidade KM25', data: '24 a 27/02/2025', situacao: 'ARTICULADO', seiDiarias: '' },
  // MARÇO 2025
  { sei: '3900009117.000036/2025-15', envio: '2025-01-07 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'União de Dois Unidos', local: 'EREM Pedro Celso, Rua Uriel de Holanda, s/n, Beberibe, Recife/PE', pontoFocal: 'Marcílio Batista 81 98879.9456 / 99695.6444', data: 'Março/25 A definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000192/2025-78', envio: '2025-01-29 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Igreja Evangélica Internacional da Bênção', local: 'Av. José de Souza Rodovalho, 03 - Cajueiro Seco, Jaboatão dos Guararapes', pontoFocal: 'Pastor José Elias 81 9 87890850', data: '2025-03-29 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000256/2025-31', envio: '2025-02-11 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Paróquia Nossa Senhora da Ajuda', local: 'Rua Campina Grande, s/n, Jardim Brasil II - Olinda /PE', pontoFocal: 'Janete Lira 819 86711387 / Adriana Ferreira 81 999057861', data: '2025-03-22 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900000017.000212/2025-64', envio: '2025-02-13 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Instituto de Criminalística Professor Armando Samico', local: 'Rua Odorico Mendes, nº 700, Campo Grande, Recife-PE', pontoFocal: 'Comissário Amauri Filho (81) 9 9649-1450', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000295/2025-38', envio: '2025-02-13 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Associação dos Moradores da Campina do Barreto', local: 'Rua Dr. Elias Gomes, 85, campina do Barreto, Recife-PE', pontoFocal: 'Presidente Célio José (81) 9 88267223', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000285/2025-01', envio: '2025-02-12 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Associação dos Moradores da Baixinha e Adjacências', local: 'Rua 26 de Maio, 68 - Tabatinga II, Camaragibe-PE', pontoFocal: 'Diretor Antônio Vicente (81) 9 86146807', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '1400005489.000005/2025-64', envio: '2025-02-19 00:00:00', assunto: 'Solicita JPE', type: 'JPE', solicitante: 'GRE – Agreste Meridional', local: 'EREM Francisco Pereira da Costa - Avenida Sete de Setembro, sn, Centro, Iati/PE', pontoFocal: '(87) 99920-1665 Mª Joselane', data: '17 , 18 e 19/03/2025', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900009117.000364/2025-11', envio: '2025-02-18 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Prefeitura de Cabrobó', local: 'Rua Dr. Antônio Novaes, 422 – Centro – Cabrobó-PE', pontoFocal: 'Marcos Rosbany (87) 99197-6918 / Susana Maria (87) 9819-3857 (81) 9 86146807', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000350/2025-90', envio: '2025-02-18 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Catende/PE', pontoFocal: 'Prefeita de Catende Gracina Maria (Dona Graça)', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000342/2025-43', envio: '2025-02-18 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Ipojuca/PE', pontoFocal: 'Prefeito de Ipojuca Carlos Santana', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000489/2025-33', envio: '2025-02-28 00:00:00', assunto: 'Solicita JPS e JPE', type: 'JPS', solicitante: 'SUP FED do Desenvolvimento Agrário PE', local: 'Araripina', pontoFocal: 'A definir', data: '18, 19 e 20/03/2025', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900009117.000489/2025-33', envio: '2025-02-28 00:00:00', assunto: 'Solicita JPS e JPE', type: 'JPE', solicitante: 'SUP FED do Desenvolvimento Agrário PE', local: 'Serra Talhada', pontoFocal: 'A definir', data: '25, 26 e 27/03/2025', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900000003.001420/2025-30', envio: '2025-02-26 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Prefeitura Cachoeirinha', local: 'Escola Rita Alves Espindola', pontoFocal: 'Maristela 81 999639946', data: '2025-03-29 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900001170.001144/2025-41', envio: '2025-03-19 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Secretaria da Mulher Ipojuca', local: 'Local a definir', pontoFocal: 'Ana Carolina SEC', data: '2025-03-21 00:00:00', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '1900000157.000262/2025-21', envio: '2025-03-19 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SUPAS/SEAPREV/SJDHPV', local: 'Terreiro dos Palmares - Rua Maranhão, 126 B, Santo Onofre, Palmares – PE', pontoFocal: 'Camilla Iumatti Freitas', data: '2025-03-20 00:00:00', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '1900000119.000217/2025-22', envio: '2025-03-25 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Secretaria Executiva de Promoção da Equidade Social SJDHPV - SEPES', local: 'Belém de São Francisco Local a definir', pontoFocal: 'Superintendente Marcos Gervásio', data: '2025-03-29 00:00:00', situacao: 'ARTICULADO', seiDiarias: '' },
  // ABRIL 2025
  { sei: '3900000003.009000/2024-11', envio: '2025-01-02 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Associacao Aprender e Conviver do Coque', local: 'Rua do Campo, 113, Ilha Joana Bezerra, Recife/PE', pontoFocal: 'Edineuza Otília 81986009545', data: '2025-04-30 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000335/2025-41', envio: '2025-02-18 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Igreja Batista da Mangabeira', local: 'Rua da Lira, 478, Mangabeira, Recife/PE', pontoFocal: 'Pastor Cláudio 81 987414360 / Márcia 81 986112780', data: '2025-04-12 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000392/2025-21', envio: '2025-02-21 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'TJPE', local: 'Casa de Justiça Coque Rua Cabo Eutrópio, 178 - Ilha Joana Bezerra, Recife/PE', pontoFocal: 'Djanira Maria 81 986824486', data: '2025-04-10 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000484/2025-19', envio: '2025-02-28 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Prefeitura de Cedro', local: 'Secretaria de Assistência Social', pontoFocal: 'Kelly 87 8108-2862', data: 'A Definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000489/2025-33', envio: '2025-02-28 00:00:00', assunto: 'Solicita JPS e JPE', type: 'JPS', solicitante: 'SUP FED do Desenvolvimento Agrário PE', local: 'Gamaleira', pontoFocal: 'A definir', data: '01, 02 03/04/2025', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900009117.000489/2025-33', envio: '2025-02-28 00:00:00', assunto: 'Solicita JPS e JPE', type: 'JPE', solicitante: 'SUP FED do Desenvolvimento Agrário PE', local: 'Goiana', pontoFocal: 'A definir', data: '09, 10 E 11/04/2025', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900000017.000212/2025-64', envio: '2025-02-13 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Instituto de Criminalística Professor Armando Samico', local: 'Rua Odorico Mendes, nº 700, Campo Grande, Recife-PE', pontoFocal: 'Comissário Amauri Filho (81) 9 9649-1450', data: '2025-04-15 00:00:00', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900009117.000401/2025-83', envio: '2025-02-24 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Barra de Guabiraba, local a definir', pontoFocal: 'Prefeito Diogo Lima', data: 'A Definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000414/2025-52', envio: '2025-02-24 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Ferreiros, local a definir', pontoFocal: 'Prefeito José Roberto', data: 'A Definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000397/2025-53', envio: '2025-02-24 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Bom Jardim, local a definir', pontoFocal: 'Prefeito Janjão', data: 'A Definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000409/2025-40', envio: '2025-02-24 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Alagoinha, local a definir', pontoFocal: 'Prefeito Simãozinho', data: 'A Definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000406/2025-14', envio: '2025-02-24 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Barreiros, local a definir', pontoFocal: 'Prefeito Carlinhos da Pedreira', data: 'A Definir', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000486/2025-08', envio: '2025-03-11 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Câmara de Camaragibe', local: 'A definir', pontoFocal: 'Acrecia 81991694794, Selma 81999557433', data: '2025-04-26 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000533/2025-13', envio: '2025-02-18 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'SÃO JOAQUIM DO MONTE/PE Local a Definir', pontoFocal: 'Prefeito Eduardo José', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000541/2025-51', envio: '2025-03-17 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SEST/SENAT', local: 'Av. Marechal Mascarenhas de Morais, 4152 - Imbiribeira - Recife/PE', pontoFocal: 'Ponto Focal Diretora Monalisa de Matos', data: '2025-04-01 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000569/2025-99', envio: '2025-02-18 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'LAGOA DO CARRO/PE Local a Definir', pontoFocal: 'Prefeito José Luiz', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000571/2025-68', envio: '2025-03-17 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'CORTÊS/PE Local a Definir', pontoFocal: 'Prefeita Fátima', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000572/2025-11', envio: '2025-03-17 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'SANTA MARIA DO CAMBUCÁ/PE Local a Definir', pontoFocal: 'Prefeito Júnior de Beto', data: 'A DEFINIR', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '1900000119.000217/2025-22', envio: '2025-03-25 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Secretaria Executiva de Promoção da Equidade Social SJDHPV - SEPES', local: 'Camocim de São Félix Local a definir', pontoFocal: 'Superintendente Marcos Gervásio', data: '2025-04-24 00:00:00', situacao: 'ARTICULADO', seiDiarias: '' },
  { sei: '3900001149.000021/2025-60\n3900009117.000682/2025-74', envio: '25/03/2025', assunto: 'Solicita JPS', type: 'JPS', solicitante: '7ª REGIÃO MILITAR', local: 'Parque Histórico Nacional dos Guararapes(PHNG)', pontoFocal: '1º Tenente Flávio (81)98963-1647 ou (11)98262 4978', data: '05 e 06/04/2025', situacao: 'REALIZADO', seiDiarias: '' },
  { sei: '3900009117.000665/2025-37', envio: '2025-03-27 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Prefeitura Surubim', local: 'Local a definir', pontoFocal: 'Thais Karine 81 99950.5649', data: 'Preferencialmente para Abril/2025', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000700/2025-18', envio: '2025-03-31 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Grupo de Mães de Crianças Especiais PE', local: 'Praça Eng. Massangana, s/n Santo Amaro Recife PE', pontoFocal: 'Daniele Pedrosa 81988730744', data: '2025-04-02 00:00:00', situacao: 'REALIZADO', seiDiarias: '' },
  { sei: '2300000286.000198/2025-15', envio: '2025-03-28 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Conselho Estadual de Saúde de Pernambuco – CES/PE', local: 'Parque 13 de Maio, localizado na Rua Mamede Simões, 111 - Boa Vista, Recife', pontoFocal: 'Coordenadora Sabrina 3184-4210', data: '2025-04-07 00:00:00', situacao: 'CANCELADO PELO SOLICITANTE', seiDiarias: '' },
  { sei: '2300000286.000169/2025-45', envio: '2025-02-26 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Conselho Estadual de Saúde de Pernambuco', local: 'A definir', pontoFocal: 'Sabrina Roberta 3184.4210', data: '2025-04-07 00:00:00', situacao: 'CANCELADO PELO SOLICITANTE', seiDiarias: '' },
  { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Santo Amaro, Praça do Campo Santo, 1-101 - Santo Amaro, Recife - PE', pontoFocal: 'Bruna Gonçalves 81 971104433', data: '2025-04-25 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Goiana, EREM Augusto Gondim, Centro GOIANA/PE', pontoFocal: 'Virgínia Costa 81 989509951', data: '2025-04-30 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
  { sei: '1900000001.006085/2024-89', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Secretária de Justiça e Direitos Humanos e Prevenção à Violência', local: 'Ação Juntos pela Cidadania em Caruaru, Escola Municipal Laura Florêncio – R. Pres. Artur Bernardes, s/n, Salgado, Caruaru – PE', pontoFocal: "Joana D'Arc da Silva Figueiredo", data: '2025-04-12 00:00:00', situacao: 'ARTICULADO', seiDiarias: '' },
   // MAIO 2025
   { sei: '3900000003.001787/2025-53', envio: '2025-03-14 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Centro Judiciário de Solução de Conflitos e Cidadania da Comarca de Serra Talhada – (CEJUSC)', local: 'Fórum Juiz Clodoaldo Bezerra de Souza e Silva\nRua Cabo Joaquim Da Mata, s/n - 2º andar - Tancredo neves - Serra Talhada/PE', pontoFocal: 'Juiz Diógenes Portela', data: '2025-05-07 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000685/2025-16', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Colégio Adventista de Arruda, Rua Zeferino Agra, s/n', pontoFocal: 'Dep. Renato Antunes 3183.2262 / 2272', data: '2025-05-23 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000761/2025-85', envio: '2025-04-07 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Templo Oração e Poder', local: 'Rua Tijuca, s/n, Alto da Conquista - Olinda/PE', pontoFocal: 'Cleyton Olinda 81 998806445', data: '2025-05-31 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900000003.002340/2025-00', envio: '2025-04-04 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'ALEPE', local: 'Brejo da Madre de Deus', pontoFocal: 'Dep. Doriel Barros 3183.2153 / 2253', data: '2025-05-09 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Garanhuns - Local a Definir', pontoFocal: 'Graça Barros 87 996312771', data: '2025-05-16 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Araripina Local a Definir', pontoFocal: 'Hamanda Emanuela 87 999590346', data: '2025-05-16 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Caruaru Escola Estadual Elisiete Lopes R. Cristo Redentor - Kennedy, Caruaru/PE', pontoFocal: 'Katianny Cinthia 81 992690523', data: '2025-05-21 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Arcoverde Local a definir', pontoFocal: 'Talita Ferreíra 87 996018961', data: '2025-05-26 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Piedade EREM Prof. Epitacio André Dias, R. Profa. Cândida Andrade Maciel, 405 - Cajueiro Seco, Jaboatão dos Guararapes/PE', pontoFocal: 'Cecilia Marinho 81 998305155', data: '2025-05-30 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000716/2025-21', envio: '2025-04-02 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'CÂMARA DE PAULISTA', local: 'Rua das Flores, S/N - Paratibe - Paulista PE', pontoFocal: 'Eudes Farias 81988813388', data: 'A definir', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000673/2025-83', envio: '2025-03-31 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Faculdade Santíssima Trindade', local: 'A Definir', pontoFocal: 'Vice-Diretra Silvana Gomes', data: 'Entre os dias 05 e 09/05/2025', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900000021.001163/2025-18', envio: '2025-04-15 00:00:00', assunto: 'Solicita JPS', type: 'JPS', solicitante: 'Câmara de São José do Belmonte', local: 'A Definir', pontoFocal: 'Vereador Evandro Alves', data: 'A definir', situacao: 'SOLICITADO', seiDiarias: '' },
   // JUNHO 2025
   { sei: '3900000003.001787/2025-53', envio: '2025-03-14 00:00:00', assunto: 'Solicita JPS (Junho)', type: 'JPS', solicitante: 'Centro Judiciário de Solução de Conflitos e Cidadania da Comarca de Serra Talhada – (CEJUSC)', local: 'Fórum Juiz Clodoaldo Bezerra de Souza e Silva\nRua Cabo Joaquim Da Mata, s/n - 2º andar - Tancredo neves - Serra Talhada/PE', pontoFocal: 'Juiz Diógenes Portela', data: '2025-06-07 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' }, // Note: Data here is May, not June. Correcting for "Junho" in title.
   { sei: '3900009117.000685/2025-16', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS (Junho)', type: 'JPS', solicitante: 'ALEPE', local: 'Colégio Adventista de Arruda, Rua Zeferino Agra, s/n', pontoFocal: 'Dep. Renato Antunes 3183.2262 / 2272', data: '2025-06-23 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000761/2025-85', envio: '2025-04-07 00:00:00', assunto: 'Solicita JPS (Junho)', type: 'JPS', solicitante: 'Templo Oração e Poder', local: 'Rua Tijuca, s/n, Alto da Conquista - Olinda/PE', pontoFocal: 'Cleyton Olinda 81 998806445', data: 'A definir', situacao: 'SOLICITADO', seiDiarias: '' }, // A definir might be June
   { sei: '3900000003.002340/2025-00', envio: '2025-04-04 00:00:00', assunto: 'Solicita JPS (Junho)', type: 'JPS', solicitante: 'ALEPE', local: 'Brejo da Madre de Deus', pontoFocal: 'Dep. Doriel Barros 3183.2153 / 2253', data: '2025-06-09 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
   { sei: '3900009117.000717/2025-75', envio: '2025-04-03 00:00:00', assunto: 'Solicita JPS (Junho)', type: 'JPS', solicitante: 'SESC (PROJETO COLMEIA)', local: 'Sesc Goiana, EREM Augusto Gondim, Centro GOIANA/PE', pontoFocal: 'Virgínia Costa 81 989509951', data: '2025-06-30 00:00:00', situacao: 'SOLICITADO', seiDiarias: '' },
];

let agendaEvents: AgendaEvent[] = rawEventsData.map(raw => {
    let submissionDate: Date | null = null;
    if (raw.envio && raw.envio !== '-') {
        try {
            let parsedDate = parse(raw.envio, 'yyyy-MM-dd HH:mm:ss', new Date());
             if (!isValid(parsedDate)) parsedDate = parse(raw.envio, 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) submissionDate = parsedDate;
            else console.warn(`Could not parse submission date: ${raw.envio}`);
        } catch (e) { console.error(`Error parsing submission date: ${raw.envio}`, e); }
    }
    const submissionDateISO = submissionDate && isValid(submissionDate) ? formatISO(submissionDate) : 'Data Inválida';

    const { start: eventStartDate, end: eventEndDate } = parseDateString(
        raw.data,
        submissionDate?.getFullYear() ?? new Date().getFullYear(),
        submissionDate?.getMonth() ?? new Date().getMonth()
    );

    const isDateTrulyUndefined = /a definir|preferencialmente|entre os dias/i.test(raw.data);
    // Fallback to a date in the future if parsing fails and it's not explicitly "A definir"
    // For "A definir", null will be used, and formatISO will later result in 'Hora Inválida'
    const fallbackDate = isDateTrulyUndefined ? null : addMonths(new Date(), 1); 
    const effectiveStartDate = eventStartDate ?? fallbackDate;
    const effectiveEndDate = eventEndDate ?? effectiveStartDate;

    let startTimeISO: string = 'Hora Inválida';
    let endTimeISO: string = 'Hora Inválida';

    try {
         if(effectiveStartDate && isValid(effectiveStartDate)) {
             const startDateTime = parse(`${formatISO(effectiveStartDate, { representation: 'date' })}T${DEFAULT_START_TIME}`, "yyyy-MM-dd'T'HH:mm", new Date());
             if(isValid(startDateTime)) startTimeISO = formatISO(startDateTime);
         }
         if(effectiveEndDate && isValid(effectiveEndDate)) {
            const endDateTime = parse(`${formatISO(effectiveEndDate, { representation: 'date' })}T${DEFAULT_END_TIME}`, "yyyy-MM-dd'T'HH:mm", new Date());
             if(isValid(endDateTime)) endTimeISO = formatISO(endDateTime);
             else if (startTimeISO !== 'Hora Inválida') endTimeISO = startTimeISO;
         } else if (startTimeISO !== 'Hora Inválida') {
             endTimeISO = startTimeISO;
         }
    } catch(e) { console.error(`Error creating ISO times for event: ${raw.assunto} with date string: ${raw.data}`, e); }

    // Infer type from assunto if not provided, or default to "OUTRO"
    let eventType = raw.type;
    if (!eventType) {
        if (raw.assunto.toLowerCase().includes('jps') && raw.assunto.toLowerCase().includes('jpe')) {
            eventType = 'JPS E JPE';
        } else if (raw.assunto.toLowerCase().includes('jps')) {
            eventType = 'JPS';
        } else if (raw.assunto.toLowerCase().includes('jpe')) {
            eventType = 'JPE';
        } else if (raw.assunto.toLowerCase().includes('reunião')) {
            eventType = 'REUNIÃO';
        } else if (raw.assunto.toLowerCase().includes('governo')) {
            eventType = 'AÇÃO DE GOVERNO';
        }
        // Add more inferences as needed
    }
    
    return {
        id: generateRandomId(),
        seiNumber: raw.sei && raw.sei !== '-' ? raw.sei.replace(/<br>/g, ', ').replace(/\n/g, ', ') : undefined,
        submissionDate: submissionDateISO,
        title: raw.assunto,
        requester: raw.solicitante,
        location: raw.local.replace(/<br>/g, '\n'),
        focalPoint: raw.pontoFocal,
        startTime: startTimeISO,
        endTime: endTimeISO,
        situation: raw.situacao?.toUpperCase().replace('REALIZADA', 'REALIZADO'),
        dailySeiNumber: raw.seiDiarias && raw.seiDiarias !== 'Não atendido' ? raw.seiDiarias.replace(/<br>/g, ', ').replace(/\n/g, ', ') : undefined,
        description: undefined, 
        participants: undefined,
        type: eventType || raw.type || 'OUTRO', // Ensure type is set
    };
});

export async function fetchEventsForDay(date: Date): Promise<AgendaEvent[]> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const eventsForDay = agendaEvents.filter(event => {
    try {
        if (event.startTime === 'Hora Inválida') {
             if (event.submissionDate !== 'Data Inválida') {
                 const subDate = parseISO(event.submissionDate);
                 return isValid(subDate) && isWithinInterval(subDate, { start: dayStart, end: dayEnd });
             }
             return false;
        }
        const eventStart = parseISO(event.startTime);
        const eventEnd = (event.endTime && event.endTime !== 'Hora Inválida') ? parseISO(event.endTime) : eventStart;
        if(!isValid(eventStart) || !isValid(eventEnd)) return false;
        return isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
               isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
               (startOfDay(eventStart) <= dayEnd && startOfDay(eventEnd) >= dayStart); // Check overlap for multi-day events
    } catch (e) {
         console.error(`Error filtering event ID ${event.id} for day ${formatISO(date)}:`, e);
         return false;
    }
  });

  eventsForDay.sort((a, b) => {
      try {
         if (a.startTime === 'Hora Inválida' && b.startTime === 'Hora Inválida') return 0;
         if (a.startTime === 'Hora Inválida') return 1; 
         if (b.startTime === 'Hora Inválida') return -1;
         const dateA = parseISO(a.startTime);
         const dateB = parseISO(b.startTime);
         if(!isValid(dateA) && !isValid(dateB)) return 0;
         if(!isValid(dateA)) return 1;
         if(!isValid(dateB)) return -1;
        return compareAsc(dateA, dateB);
      } catch { return 0; }
  });
  return eventsForDay;
}

export async function fetchMonthlyEvents(monthDate: Date): Promise<AgendaEvent[]> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const monthlyEvents = agendaEvents.filter(event => {
     try {
         if (event.startTime === 'Hora Inválida') {
              if (event.submissionDate !== 'Data Inválida') {
                  const subDate = parseISO(event.submissionDate);
                  return isValid(subDate) && isWithinInterval(subDate, { start: monthStart, end: monthEnd });
              }
              return false;
         }
        const eventStart = parseISO(event.startTime);
        const eventEnd = (event.endTime && event.endTime !== 'Hora Inválida') ? parseISO(event.endTime) : eventStart;
        if(!isValid(eventStart) || !isValid(eventEnd)) return false;
        return isWithinInterval(startOfDay(eventStart), { start: monthStart, end: monthEnd }) ||
               isWithinInterval(startOfDay(eventEnd), { start: monthStart, end: monthEnd }) ||
               (startOfDay(eventStart) <= monthEnd && startOfDay(eventEnd) >= monthStart); // Check overlap
    } catch (e) {
         console.error(`Error filtering event ID ${event.id} for month ${formatISO(monthDate)}:`, e);
         return false;
    }
  });

   monthlyEvents.sort((a, b) => {
       try {
            if (a.startTime === 'Hora Inválida' && b.startTime === 'Hora Inválida') return 0;
            if (a.startTime === 'Hora Inválida') return 1;
            if (b.startTime === 'Hora Inválida') return -1;
            const dateA = parseISO(a.startTime);
            const dateB = parseISO(b.startTime);
            if(!isValid(dateA) && !isValid(dateB)) return 0;
            if(!isValid(dateA)) return 1;
            if(!isValid(dateB)) return -1;
           return compareAsc(dateA, dateB);
       } catch { return 0; }
   });
  return monthlyEvents;
}

export async function fetchWeeklyEvents(targetDate: Date): Promise<AgendaEvent[]> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

  const weeklyEvents = agendaEvents.filter(event => {
    try {
      if (event.startTime === 'Hora Inválida') {
        if (event.submissionDate !== 'Data Inválida') {
          const subDate = parseISO(event.submissionDate);
          return isValid(subDate) && isWithinInterval(subDate, { start: weekStart, end: weekEnd });
        }
        return false;
      }
      const eventStart = parseISO(event.startTime);
      const eventEnd = (event.endTime && event.endTime !== 'Hora Inválida') ? parseISO(event.endTime) : eventStart;
      if(!isValid(eventStart) || !isValid(eventEnd)) return false;
      return (startOfDay(eventStart) <= weekEnd && startOfDay(eventEnd) >= weekStart);

    } catch (e) {
      console.error(`Error filtering event ID ${event.id} for week of ${formatISO(targetDate)}:`, e);
      return false;
    }
  });

  weeklyEvents.sort((a, b) => {
    try {
      if (a.startTime === 'Hora Inválida' && b.startTime === 'Hora Inválida') return 0;
      if (a.startTime === 'Hora Inválida') return 1;
      if (b.startTime === 'Hora Inválida') return -1;
      const dateA = parseISO(a.startTime);
      const dateB = parseISO(b.startTime);
      if(!isValid(dateA) && !isValid(dateB)) return 0;
      if(!isValid(dateA)) return 1;
      if(!isValid(dateB)) return -1;
      return compareAsc(dateA, dateB);
    } catch { return 0; }
  });
  return weeklyEvents;
}


export async function getEventById(eventId: string): Promise<AgendaEvent | null> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    const event = agendaEvents.find(e => e.id === eventId);
    return event || null;
}

export async function addEvent(newEventData: Omit<AgendaEvent, 'id' | 'submissionDate' | 'startTime' | 'endTime' | 'type'> & { submissionDate: Date, eventDate: Date, type?: string }): Promise<AgendaEvent> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
     let submissionDateISO: string;
     let startTimeISO: string = 'Hora Inválida';
     let endTimeISO: string = 'Hora Inválida';

     try {
         submissionDateISO = (newEventData.submissionDate && isValid(newEventData.submissionDate)) ? formatISO(newEventData.submissionDate) : 'Data Inválida';
     } catch { submissionDateISO = 'Data Inválida'; }

      try {
         if(newEventData.eventDate && isValid(newEventData.eventDate)) {
             const startDateString = formatISO(newEventData.eventDate, { representation: 'date' });
             const startDateTime = parse(`${startDateString}T${DEFAULT_START_TIME}`, "yyyy-MM-dd'T'HH:mm", new Date());
             const endDateTime = parse(`${startDateString}T${DEFAULT_END_TIME}`, "yyyy-MM-dd'T'HH:mm", new Date());
             if(isValid(startDateTime)) startTimeISO = formatISO(startDateTime);
             if(isValid(endDateTime)) endTimeISO = formatISO(endDateTime);
             else if (startTimeISO !== 'Hora Inválida') endTimeISO = startTimeISO;
         }
      } catch (e){ console.error(`Error creating ISO times during addEvent for: ${newEventData.title}`, e); }

    const newEvent: AgendaEvent = {
        ...newEventData,
        id: generateRandomId(),
        submissionDate: submissionDateISO,
        startTime: startTimeISO,
        endTime: endTimeISO,
        type: newEventData.type || 'OUTRO',
    };
     if ('eventDate' in newEvent) delete (newEvent as any).eventDate;

    agendaEvents.unshift(newEvent); 
    return newEvent;
}

export async function updateEvent(
    eventId: string,
    updatedData: Partial<Omit<AgendaEvent, 'id' | 'submissionDate' | 'startTime' | 'endTime' | 'type'>> & { submissionDate?: Date | null, eventDate?: Date | null, type?: string }
): Promise<AgendaEvent | null> {
    await new Promise(resolve => setTimeout(resolve, 100)); 
    const eventIndex = agendaEvents.findIndex(event => event.id === eventId);

    if (eventIndex > -1) {
        const existingEvent = agendaEvents[eventIndex];
        
        const processedUpdatedData: Partial<AgendaEvent> = { ...updatedData };
        delete (processedUpdatedData as any).eventDate; 

        if (updatedData.submissionDate === null) {
            processedUpdatedData.submissionDate = 'Data Inválida';
        } else if (updatedData.submissionDate && isValid(updatedData.submissionDate)) {
            try {
                processedUpdatedData.submissionDate = formatISO(updatedData.submissionDate);
            } catch (e) {
                console.error(`Error formatting updated submissionDate for event ${eventId}`, e);
                processedUpdatedData.submissionDate = 'Data Inválida';
            }
        } else if (updatedData.hasOwnProperty('submissionDate') && !updatedData.submissionDate) {
             processedUpdatedData.submissionDate = existingEvent.submissionDate || 'Data Inválida';
        }


        if (updatedData.eventDate === null) {
            processedUpdatedData.startTime = 'Hora Inválida';
            processedUpdatedData.endTime = 'Hora Inválida';
        } else if (updatedData.eventDate && isValid(updatedData.eventDate)) {
            try {
                const startDateString = formatISO(updatedData.eventDate, { representation: 'date' });
                const startDateTime = parse(`${startDateString}T${DEFAULT_START_TIME}`, "yyyy-MM-dd'T'HH:mm", new Date());
                const endDateTime = parse(`${startDateString}T${DEFAULT_END_TIME}`, "yyyy-MM-dd'T'HH:mm", new Date());

                if (isValid(startDateTime)) processedUpdatedData.startTime = formatISO(startDateTime);
                else processedUpdatedData.startTime = 'Hora Inválida';

                if (isValid(endDateTime)) processedUpdatedData.endTime = formatISO(endDateTime);
                else if (processedUpdatedData.startTime !== 'Hora Inválida') processedUpdatedData.endTime = processedUpdatedData.startTime;
                else processedUpdatedData.endTime = 'Hora Inválida';
            } catch (e) {
                 console.error(`Error formatting updated eventDate/times for event ${eventId}`, e);
                 processedUpdatedData.startTime = 'Hora Inválida'; 
                 processedUpdatedData.endTime = 'Hora Inválida';
            }
        } else if (updatedData.hasOwnProperty('eventDate') && !updatedData.eventDate) {
            processedUpdatedData.startTime = existingEvent.startTime || 'Hora Inválida';
            processedUpdatedData.endTime = existingEvent.endTime || 'Hora Inválida';
        }
        
        if (updatedData.type) {
            processedUpdatedData.type = updatedData.type;
        }

        const finalUpdatedEvent = { ...existingEvent, ...processedUpdatedData } as AgendaEvent;
        agendaEvents[eventIndex] = finalUpdatedEvent;
        
        return finalUpdatedEvent;
    }
    return null;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100)); 
    const indexToRemove = agendaEvents.findIndex(event => event.id === eventId);
    if (indexToRemove > -1) {
        agendaEvents.splice(indexToRemove, 1);
        agendaEvents = [...agendaEvents]; 
        return true;
    }
    return false;
}

export interface FilterCriteria {
    seiNumber?: string;
    actionType?: string;
    startDate?: Date;
    endDate?: Date;
    situation?: string;
    focalPoint?: string;
    location?: string; 
  }
  
export async function fetchFilteredEvents(filters: FilterCriteria): Promise<AgendaEvent[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); 
  
    let filtered = [...agendaEvents];
  
    if (filters.seiNumber) {
      const cleanSei = filters.seiNumber.replace(/[^\d]/g, ""); 
      filtered = filtered.filter(event => event.seiNumber && event.seiNumber.replace(/[^\d]/g, "").includes(cleanSei));
    }
  
    if (filters.actionType && filters.actionType !== "TODOS") {
      filtered = filtered.filter(event => event.type?.toLowerCase() === filters.actionType?.toLowerCase());
    }
  
    if (filters.startDate || filters.endDate) {
      const filterStart = filters.startDate ? startOfDay(filters.startDate) : null;
      const filterEnd = filters.endDate ? endOfDay(filters.endDate) : null;
  
      filtered = filtered.filter(event => {
        if (event.startTime === 'Hora Inválida') {
            if (event.submissionDate !== 'Data Inválida') {
                try {
                    const subDate = startOfDay(parseISO(event.submissionDate));
                     if (!isValid(subDate)) return false;
                     if (filterStart && filterEnd) return isWithinInterval(subDate, { start: filterStart, end: filterEnd });
                     if (filterStart) return subDate >= filterStart;
                     if (filterEnd) return subDate <= filterEnd;
                } catch { return false; }
            }
            return false; 
        }
        try {
          const eventStart = startOfDay(parseISO(event.startTime));
          if (!isValid(eventStart)) return false;
  
          if (filterStart && filterEnd) return isWithinInterval(eventStart, { start: filterStart, end: filterEnd });
          if (filterStart) return eventStart >= filterStart;
          if (filterEnd) return eventStart <= filterEnd;
          return true; 
        } catch {
          return false;
        }
      });
    }
  
    if (filters.situation && filters.situation !== "TODAS") {
      filtered = filtered.filter(event => event.situation?.toLowerCase() === filters.situation?.toLowerCase());
    }
  
    if (filters.focalPoint) {
      const focalPointLower = filters.focalPoint.toLowerCase();
      filtered = filtered.filter(event => event.focalPoint?.toLowerCase().includes(focalPointLower));
    }

    if (filters.location) { 
        const locationLower = filters.location.toLowerCase();
        filtered = filtered.filter(event => event.location?.toLowerCase().includes(locationLower));
    }
  
    filtered.sort((a, b) => {
      const dateAValid = a.startTime !== 'Hora Inválida' && isValid(parseISO(a.startTime));
      const dateBValid = b.startTime !== 'Hora Inválida' && isValid(parseISO(b.startTime));
      
      const submissionAValid = a.submissionDate !== 'Data Inválida' && isValid(parseISO(a.submissionDate));
      const submissionBValid = b.submissionDate !== 'Data Inválida' && isValid(parseISO(b.submissionDate));

      const dateA = dateAValid ? parseISO(a.startTime) : (submissionAValid ? parseISO(a.submissionDate) : new Date(0));
      const dateB = dateBValid ? parseISO(b.startTime) : (submissionBValid ? parseISO(b.submissionDate) : new Date(0));
      
      if (!isValid(dateA) && !isValid(dateB)) return 0;
      if (!isValid(dateA)) return 1; // Invalid dates go to the end
      if (!isValid(dateB)) return -1; // Invalid dates go to the end
      return compareAsc(dateB, dateA); // Sort by descending date (newest first)
    });
  
    return filtered;
  }

    