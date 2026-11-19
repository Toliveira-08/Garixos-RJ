// Assistente virtual "Gari".
// Usa o Google Gemini quando GEMINI_API_KEY está configurada; caso contrário (ou se a API falhar),
// responde com um conjunto de respostas prontas, para o projeto funcionar sem chave.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ASSISTANT_SYSTEM_PROMPT = `
Você é a Assistente Virtual do Garixos, uma plataforma municipal de coleta inteligente de resíduos.
Seu nome é Gari. Você é simpática, prestativa e objetiva. Responda sempre em português brasileiro.
Mantenha respostas curtas e diretas (máximo 3 parágrafos).

SOBRE O GARIXOS:
- Plataforma que conecta cidadãos a empresas de coleta de resíduos urbanos
- Funcionalidades principais:
  1. Histórico de Solicitações: consulta de todas as coletas solicitadas (data, hora, local, status)
  2. Mapa em Tempo Real: visualização de caminhões e pontos de coleta próximos
  3. Solicitar Coleta: solicitar retirada de lixo no endereço (orgânico, reciclável, eletrônico, poda, entulho)
  4. Horários de Coleta: tabela com dias e horários por tipo de resíduo
  5. Cadastro de Endereço: salvar endereços para facilitar futuras solicitações
  6. Notícias Ambientais: notícias sobre meio ambiente e sustentabilidade

HORÁRIOS DE COLETA:
- Segunda: 07h-18h - Lixo Comum
- Terça: 07h-18h - Reciclável
- Quarta: 07h-18h - Lixo Comum
- Quinta: 07h-18h - Orgânico
- Sexta: 07h-18h - Lixo Comum
- Sábado: 08h-12h - Volumoso

TIPOS DE LIXO ACEITOS: Orgânico, Reciclável, Eletrônico, Poda, Entulho

SUPORTE: O usuário pode enviar mensagens de suporte e feedback na seção "Precisa de Ajuda?" no rodapé da página.

Se não souber algo específico do sistema, oriente o usuário a usar a seção de Suporte.
Nunca invente informações que não estão acima.
`.trim();

function normalizeAssistantHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(item => item && typeof item === 'object' && typeof item.role === 'string' && Array.isArray(item.parts))
    .slice(-10)
    .map(item => ({
      role: item.role,
      parts: item.parts
        .filter(part => part && typeof part.text === 'string' && part.text.trim().length > 0)
        .map(part => ({ text: part.text }))
    }))
    .filter(item => item.parts.length > 0);
}

async function generateAssistantReply(history) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    // A chave vai no header (e não na URL) para não aparecer em logs
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: ASSISTANT_SYSTEM_PROMPT }]
      },
      contents: normalizeAssistantHistory(history)
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data && data.error && data.error.message
      ? data.error.message
      : 'Erro ao consultar o Gemini';
    throw new Error(message);
  }

  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    throw new Error('Resposta inesperada do Gemini.');
  }

  return reply;
}

const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const RESPOSTAS_PRONTAS = [
  [['solicitar', 'coleta?'], "Para solicitar uma coleta, clique no card 'Solicitar Coleta' na tela inicial, selecione o endereço desejado, o tipo de resíduo e confirme. Você poderá acompanhar o status pelo seu histórico!"],
  [['vidro'], "Vidros quebrados devem ser embalados em caixas ou garrafas PET para segurança dos coletores. Por favor, identifique a embalagem como 'Vidro'."],
  [['pilha', 'bateria'], 'Pilhas e baterias contêm metais pesados tóxicos. Entregue-as em pontos de logística reversa (supermercados ou farmácias). Nunca descarte no lixo comum!'],
  [['oleo'], 'O óleo de cozinha nunca deve ser despejado na pia. Armazene-o frio em uma garrafa PET e entregue em pontos de coleta.'],
  [['saude', 'medico', 'agulha', 'seringa'], 'Materiais de saúde (seringas, agulhas) são resíduos especiais. Coloque agulhas em recipientes rígidos e descarte-as em postos de saúde.'],
  [['horario'], "Nossos horários são de segunda a sexta, das 07h às 18h, e aos sábados das 08h às 12h. Consulte a aba 'Horários' no menu para detalhes!"],
  [['tipos de lixo', 'lixo', 'aceitos', 'residuo'], 'Aceitamos os seguintes tipos de resíduos: Orgânico, Reciclável, Eletrônico, Poda e Entulho. Cada um deles é encaminhado para o tratamento correto!']
];

function respostaPronta(history) {
  const ultima = history[history.length - 1];
  const texto = semAcento(ultima?.parts?.[0]?.text);
  const encontrada = RESPOSTAS_PRONTAS.find(([palavras]) => palavras.some((p) => texto.includes(p)));
  return encontrada
    ? encontrada[1]
    : 'Ainda não sei responder isso. Você pode falar com a nossa equipe pela seção "Precisa de Ajuda?" no rodapé da página.';
}

async function responder(history) {
  const historico = normalizeAssistantHistory(history);
  if (!historico.length) throw Object.assign(new Error('Mensagem vazia.'), { status: 400 });

  if (GEMINI_API_KEY) {
    try {
      return { reply: await generateAssistantReply(historico), fonte: 'gemini' };
    } catch (error) {
      console.warn('Gemini indisponível, usando respostas prontas:', error.message);
    }
  }
  return { reply: respostaPronta(historico), fonte: 'local' };
}

module.exports = { responder };
