// Tourist AI — dados base. Coordenadas aproximadas. Preços são estimativas indicativas (MT).
const IMG = {
  city: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
  beach1: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80',
  beach2: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  rest1: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  rest2: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  surf: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=900&q=80',
  car: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
  guide: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80'
};

const DESTINATIONS = [
  { id:'maputo', name:'Maputo', region:'Sul', type:'Cidade e cultura', lat:-25.9692, lng:32.5732, img:IMG.city,
    desc:'Capital vibrante junto ao Índico: arquitetura colonial, mercados, marisco e vida noturna.',
    season:'Maio a novembro',
    activities:['Visita à Fortaleza de Maputo e à Baixa','Estação Central dos CFM e Praça dos Trabalhadores','Mercado Central e compras de artesanato','Passeio pela Avenida Marginal ao pôr do sol','Jantar de marisco no Mercado do Peixe','Museu de História Natural','Feira de artesanato (FEIMA)','Travessia para KaTembe pela ponte e praia','Jardim Tunduru e Catedral de Nossa Senhora da Conceição','Bares e música ao vivo na Avenida Julius Nyerere']},
  { id:'inhaca', name:'Ilha de Inhaca', region:'Sul', type:'Ilha', lat:-26.0500, lng:32.9300, img:IMG.beach2,
    desc:'Ilha a curta distância de barco de Maputo, com recifes, mangais e praias calmas.',
    season:'Abril a dezembro',
    activities:['Barco desde Maputo e passeio pela vila','Snorkel no recife da Ilha dos Portugueses','Almoço de peixe grelhado na praia','Caminhada pelos mangais','Visita à Estação de Biologia Marítima','Pôr do sol na praia']},
  { id:'pontadoouro', name:'Ponta do Ouro', region:'Sul', type:'Praia e aventura', lat:-26.8450, lng:32.8920, img:IMG.surf,
    desc:'Praia de areia dourada perto da fronteira sul, famosa por golfinhos, mergulho e surf.',
    season:'Abril a novembro',
    activities:['Nadar com golfinhos (operador licenciado)','Mergulho no Pinnacles ou Techobanine','Aula de surf','Passeio de quad nas dunas','Caminhada até ao farol','Jantar à beira-mar','Visita à Reserva Especial de Maputo']},
  { id:'tofo', name:'Tofo', region:'Inhambane', type:'Praia e mergulho', lat:-23.8540, lng:35.5450, img:IMG.beach1,
    desc:'Vila de praia descontraída, uma das melhores do mundo para ver tubarões-baleia e jamantas.',
    season:'Outubro a março (tubarões-baleia), todo o ano para mergulho',
    activities:['Ocean safari com tubarões-baleia','Mergulho no Manta Reef','Aula de surf no Tofinho','Mercado do Tofo e pão caseiro','Pôr do sol no Tofinho','Passeio à cidade histórica de Inhambane','Massagem e descanso na praia','Jantar de marisco na vila']},
  { id:'inhambane', name:'Inhambane', region:'Inhambane', type:'Cidade histórica', lat:-23.8650, lng:35.3830, img:IMG.city,
    desc:'Uma das cidades mais antigas da costa, com catedral, mesquita e ruas tranquilas na baía.',
    season:'Maio a novembro',
    activities:['Passeio pelo centro histórico','Catedral velha e Mesquita','Barco tradicional até Maxixe','Mercado municipal','Museu de Inhambane']},
  { id:'vilankulo', name:'Vilankulo', region:'Inhambane', type:'Natureza e ilhas', lat:-21.9950, lng:35.3170, img:IMG.beach2,
    desc:'Porta de entrada para o Arquipélago de Bazaruto, com águas turquesa e dhows tradicionais.',
    season:'Maio a novembro',
    activities:['Passeio de dhow ao Arquipélago de Bazaruto','Snorkel no Two Mile Reef','Subir as dunas da Ilha de Bazaruto','Kitesurf na baía','Passeio a cavalo na praia','Jantar de marisco no mercado']},
  { id:'bazaruto', name:'Arquipélago de Bazaruto', region:'Inhambane', type:'Ilha e parque marinho', lat:-21.6500, lng:35.4500, img:IMG.beach1,
    desc:'Parque nacional marinho com dunas gigantes, dugongos e alguns dos resorts mais exclusivos do país.',
    season:'Maio a novembro',
    activities:['Dia nas dunas de Bazaruto','Snorkel com tartarugas','Observação de flamingos','Mergulho em Two Mile Reef','Pôr do sol de barco']},
  { id:'gorongosa', name:'Parque Nacional da Gorongosa', region:'Centro', type:'Safari', lat:-18.9740, lng:34.3500, img:IMG.guide,
    desc:'Um dos grandes casos de restauro de vida selvagem em África: leões, elefantes e o Lago Urema.',
    season:'Maio a novembro (parque pode fechar zonas na época das chuvas)',
    activities:['Game drive ao amanhecer','Visita ao Lago Urema','Safari noturno','Caminhada na Serra da Gorongosa','Visita ao laboratório E.O. Wilson','Projeto comunitário de café da Gorongosa']},
  { id:'ilhamocambique', name:'Ilha de Moçambique', region:'Norte', type:'Património UNESCO', lat:-15.0350, lng:40.7350, img:IMG.city,
    desc:'Antiga capital, Património Mundial da UNESCO, com a Fortaleza de São Sebastião e a Cidade de Pedra e Cal.',
    season:'Maio a novembro',
    activities:['Fortaleza de São Sebastião','Palácio de São Paulo e museu','Passeio pela Cidade de Pedra e Cal','Bairro de Macuti','Dhow até Goa Island','Snorkel em Chocas-Mar','Pôr do sol na ponte']},
  { id:'quirimbas', name:'Arquipélago das Quirimbas', region:'Norte', type:'Ilhas remotas', lat:-12.3700, lng:40.6100, img:IMG.beach2,
    desc:'Ilhas remotas a norte de Pemba, com história swahili e portuguesa e recifes intactos. Verifica as recomendações de segurança atuais para Cabo Delgado antes de viajar.',
    season:'Maio a novembro',
    activities:['Ilha do Ibo e a fortaleza de São João','Ourives de prata do Ibo','Passeio de dhow entre ilhas','Snorkel nos recifes','Caminhada no mangal na maré baixa']}
];

const PLACES = [
  // Alojamento
  { id:'polana', name:'Polana Serena Hotel', category:'hotel', place:'maputo', lat:-25.9732, lng:32.5966, img:IMG.hotel, price:'Luxo', desc:'Hotel histórico de 1922 com vista para a baía de Maputo, piscina e jardins.' },
  { id:'radisson', name:'Radisson Blu Hotel & Residence Maputo', category:'hotel', place:'maputo', lat:-25.9681, lng:32.6046, img:IMG.hotel, price:'Superior', desc:'Hotel moderno na Avenida Marginal, de frente para o mar.' },
  { id:'southernsun', name:'Southern Sun Maputo', category:'hotel', place:'maputo', lat:-25.9615, lng:32.6118, img:IMG.hotel, price:'Superior', desc:'Junto à praia na Marginal, prático para negócios e lazer.' },
  { id:'casabarry', name:'Casa Barry Lodge', category:'hotel', place:'tofo', lat:-23.8555, lng:35.5465, img:IMG.beach1, price:'Médio', desc:'Chalés na praia do Tofo, perto dos centros de mergulho.' },
  { id:'chitengo', name:'Chitengo Safari Camp', category:'hotel', place:'gorongosa', lat:-18.9810, lng:34.3510, img:IMG.guide, price:'Médio', desc:'Acampamento principal dentro do Parque Nacional da Gorongosa.' },
  // Restaurantes
  { id:'costadosol', name:'Restaurante Costa do Sol', category:'restaurante', place:'maputo', lat:-25.9290, lng:32.6335, img:IMG.rest2, price:'$$', desc:'Clássico de Maputo desde os anos 30, famoso pelo camarão e marisco grelhado.' },
  { id:'mercadopeixe', name:'Mercado do Peixe', category:'restaurante', place:'maputo', lat:-25.9525, lng:32.6165, img:IMG.rest1, price:'$$', desc:'Escolhe o peixe e marisco nas bancas e manda grelhar nas barracas ao lado.' },
  { id:'mercadocentral', name:'Mercado Central de Maputo', category:'restaurante', place:'maputo', lat:-25.9705, lng:32.5715, img:IMG.rest1, price:'$', desc:'Mercado municipal na Baixa: frutas, especiarias, petiscos e artesanato.' },
  { id:'mercadotofo', name:'Mercado do Tofo', category:'restaurante', place:'tofo', lat:-23.8530, lng:35.5440, img:IMG.rest2, price:'$', desc:'Mercado da vila com pão fresco, fruta, peixe e comida local barata.' },
  // Atividades
  { id:'fortaleza', name:'Fortaleza de Maputo', category:'atividade', place:'maputo', lat:-25.9745, lng:32.5745, img:IMG.city, price:'Entrada económica', desc:'Fortificação do séc. XVIII na Baixa, com pequeno museu histórico.' },
  { id:'cfm', name:'Estação Central dos CFM', category:'atividade', place:'maputo', lat:-25.9717, lng:32.5690, img:IMG.city, price:'Grátis', desc:'Estação ferroviária de 1916, uma das mais bonitas do mundo.' },
  { id:'tofoscuba', name:'Tofo Scuba', category:'atividade', place:'tofo', lat:-23.8548, lng:35.5458, img:IMG.surf, price:'Mergulho / ocean safari', desc:'Centro de mergulho com ocean safaris para ver tubarões-baleia e jamantas.' },
  { id:'peripericdivers', name:'Peri-Peri Divers', category:'atividade', place:'tofo', lat:-23.8538, lng:35.5452, img:IMG.surf, price:'Mergulho', desc:'Escola de mergulho PADI no Tofo, de iniciação a cursos avançados.' },
  { id:'dolphin', name:'Dolphin Encounters', category:'atividade', place:'pontadoouro', lat:-26.8440, lng:32.8915, img:IMG.surf, price:'Passeio de barco', desc:'Encontros responsáveis com golfinhos-roazes na Ponta do Ouro.' },
  { id:'dhowbazaruto', name:'Passeio de dhow a Bazaruto', category:'atividade', place:'vilankulo', lat:-21.9960, lng:35.3200, img:IMG.beach2, price:'Dia inteiro', desc:'Vários operadores locais saem da praia de Vilankulo. Confirma licença e coletes.' },
  { id:'safarigorongosa', name:'Game drive na Gorongosa', category:'atividade', place:'gorongosa', lat:-18.9700, lng:34.3600, img:IMG.guide, price:'Por pessoa', desc:'Safaris guiados organizados pelo parque a partir de Chitengo.' },
  { id:'saosebastiao', name:'Fortaleza de São Sebastião', category:'atividade', place:'ilhamocambique', lat:-15.0300, lng:40.7360, img:IMG.city, price:'Entrada económica', desc:'A maior fortaleza da África subsariana, do séc. XVI, na ponta da ilha.' },
  // Transportes
  { id:'lam', name:'LAM — Linhas Aéreas de Moçambique', category:'transporte', place:'maputo', lat:-25.9208, lng:32.5726, img:IMG.car, price:'Voos domésticos', desc:'Liga Maputo a Inhambane, Vilankulo, Beira, Nampula, Pemba e outras cidades.' },
  { id:'aeroporto', name:'Aeroporto Internacional de Maputo', category:'transporte', place:'maputo', lat:-25.9208, lng:32.5726, img:IMG.car, price:'Táxis à saída', desc:'Cerca de 15–20 min do centro. Combina o preço do táxi antes de entrar.' }
];

// Custo diário estimado por pessoa (MT): alojamento, comida, transporte local, atividades
const COST_TIERS = {
  economico: { label:'Económico', stay:1800, food:800, transport:400, activities:600 },
  medio:     { label:'Médio',     stay:5000, food:1800, transport:900, activities:1800 },
  luxo:      { label:'Luxo',      stay:16000, food:4000, transport:2000, activities:4500 }
};

// Taxas de câmbio aproximadas (atualiza quando necessário)
const FX = { USD: 63.9, EUR: 69.5, ZAR: 3.5, updated: 'out/2026 (aproximado)' };

// Serviços que os guias turísticos oferecem em Moçambique. Valores indicativos e negociáveis (MT).
const GUIDE_SERVICES = [
  { id:'citytour', name:'City tour a pé ou de carro', icon:'map', group:'Cidade e cultura', price:'Desde 1.500 MT / pessoa', where:['maputo','inhambane','ilhamocambique'], desc:'Os pontos principais da cidade com história e curiosidades: Baixa, Fortaleza, Estação CFM, Casa de Ferro, mercados.' },
  { id:'patrimonio', name:'Tour histórico e de património', icon:'info', group:'Cidade e cultura', price:'Desde 1.500 MT / pessoa', where:['ilhamocambique','maputo','inhambane'], desc:'Visita guiada a monumentos, fortalezas, igrejas e ao centro histórico da Ilha de Moçambique, Património Mundial da UNESCO.' },
  { id:'cultura', name:'Arte, música e cultura local', icon:'lang', group:'Cidade e cultura', price:'Desde 1.200 MT / pessoa', where:['maputo','ilhamocambique'], desc:'Bairro da Mafalala, ateliês de artistas, Núcleo de Arte, marrabenta, timbila e dança tradicional.' },
  { id:'gastronomia', name:'Tour gastronómico e mercados', icon:'food', group:'Cidade e cultura', price:'Desde 1.800 MT / pessoa', where:['maputo','inhambane','tofo'], desc:'Mercado do Peixe, provas de matapa, xima, caril de amendoim, marisco e sumos locais.' },
  { id:'comunitario', name:'Turismo comunitário e aldeias', icon:'user', group:'Cidade e cultura', price:'Desde 1.000 MT / pessoa', where:['gorongosa','vilankulo','ilhamocambique','quirimbas'], desc:'Visitas a comunidades locais, artesanato, escolas e projetos sociais, com respeito e benefício direto para a aldeia.' },
  { id:'safari', name:'Safari e game drive', icon:'compass', group:'Natureza e vida selvagem', price:'Desde 4.500 MT / pessoa', where:['gorongosa','maputo','pontadoouro'], desc:'Saídas de jipe para ver leões, elefantes, antílopes e hipopótamos no Parque da Gorongosa ou no Parque Nacional de Maputo.' },
  { id:'aves', name:'Observação de aves', icon:'eye', group:'Natureza e vida selvagem', price:'Desde 2.500 MT / pessoa', where:['gorongosa','maputo','inhaca'], desc:'Saídas cedo com guia especializado e binóculos. Moçambique tem centenas de espécies de aves.' },
  { id:'trilhos', name:'Caminhadas e trilhos', icon:'route', group:'Natureza e vida selvagem', price:'Desde 1.500 MT / pessoa', where:['gorongosa','pontadoouro','inhaca'], desc:'Trilhos de meio dia ou dia inteiro em montanha, mangal, dunas e florestas costeiras.' },
  { id:'mergulho', name:'Mergulho com garrafa', icon:'wave', group:'Mar e ilhas', price:'Desde 4.000 MT / mergulho', where:['tofo','pontadoouro','bazaruto','quirimbas'], desc:'Mergulhos em recifes com mantas, tartarugas e peixes tropicais. Também cursos para iniciantes.' },
  { id:'tubaraobaleia', name:'Snorkel com tubarão-baleia', icon:'wave', group:'Mar e ilhas', price:'Desde 3.500 MT / pessoa', where:['tofo'], desc:'Saída de barco em Tofo para nadar com tubarões-baleia e ver mantas, com briefing de segurança.' },
  { id:'golfinhos', name:'Nado com golfinhos', icon:'wave', group:'Mar e ilhas', price:'Desde 3.500 MT / pessoa', where:['pontadoouro'], desc:'Encontros responsáveis com golfinhos-roazes em Ponta do Ouro, com regras de conduta.' },
  { id:'baleias', name:'Observação de baleias', icon:'eye', group:'Mar e ilhas', price:'Desde 3.000 MT / pessoa', where:['tofo','pontadoouro','inhaca','vilankulo'], desc:'Baleias-jubarte de julho a outubro, durante a migração ao longo da costa.' },
  { id:'dhow', name:'Passeio de dhow e ilhas', icon:'sun', group:'Mar e ilhas', price:'Desde 2.500 MT / pessoa', where:['vilankulo','bazaruto','ilhamocambique','quirimbas','inhambane'], desc:'Barco tradicional à vela entre ilhas, com paragem para snorkel, praia e almoço de marisco.' },
  { id:'ilhadia', name:'Excursão de um dia a ilha', icon:'sun', group:'Mar e ilhas', price:'Desde 3.000 MT / pessoa', where:['inhaca','bazaruto','quirimbas'], desc:'Dia na Inhaca, Ilha dos Portugueses, Bazaruto, Benguerra ou Ibo, com transporte e almoço.' },
  { id:'pesca', name:'Pesca desportiva', icon:'wave', group:'Mar e ilhas', price:'Desde 6.000 MT / saída', where:['pontadoouro','vilankulo','bazaruto','inhambane'], desc:'Pesca em alto mar ou de costa, com equipamento, e respeito pelas regras de captura e devolução.' },
  { id:'aquaticos', name:'Surf, kitesurf, caiaque e SUP', icon:'wave', group:'Mar e ilhas', price:'Desde 1.500 MT / sessão', where:['tofo','pontadoouro','vilankulo'], desc:'Aulas e aluguer com instrutor: surf em Tofo, kitesurf em Vilankulo, caiaque no mangal.' },
  { id:'cavalo', name:'Passeio a cavalo na praia', icon:'sun', group:'Mar e ilhas', price:'Desde 3.000 MT / pessoa', where:['vilankulo','pontadoouro'], desc:'Passeios ao nascer ou pôr do sol pela praia e dunas.' },
  { id:'transfer', name:'Transfer e motorista-guia', icon:'car', group:'Apoio à viagem', price:'Desde 1.500 MT / trajeto', where:['maputo','inhambane','vilankulo','pontadoouro','tofo'], desc:'Recolha no aeroporto, transfers entre cidades e motorista que explica o caminho. 4x4 quando é preciso.' },
  { id:'traducao', name:'Tradução e intérprete', icon:'lang', group:'Apoio à viagem', price:'Desde 2.000 MT / dia', where:['maputo','ilhamocambique','gorongosa','vilankulo'], desc:'Português, inglês e línguas locais como changana, macua e sena, para passeios, compras ou negócios.' },
  { id:'fotografia', name:'Fotografia de viagem', icon:'eye', group:'Apoio à viagem', price:'Desde 2.500 MT / sessão', where:['maputo','tofo','ilhamocambique','vilankulo'], desc:'Guia-fotógrafo que leva aos melhores pontos e entrega as fotos da tua viagem.' },
  { id:'planeamento', name:'Planeamento e reservas', icon:'compass', group:'Apoio à viagem', price:'A negociar', where:['maputo','inhambane','vilankulo'], desc:'Ajuda a montar o roteiro, reservar alojamento, barcos e entradas em parques.' },
  { id:'expedicao', name:'Expedição de vários dias', icon:'route', group:'Apoio à viagem', price:'Desde 15.000 MT / pessoa', where:['gorongosa','quirimbas','vilankulo','ilhamocambique'], desc:'Viagens de 2 a 7 dias com guia, transporte, alojamento e refeições, por exemplo Gorongosa ou norte do país.' }
];
