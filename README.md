# Tourist AI — Moçambique

App web (PWA) pronta a usar: funciona no telemóvel, instala-se no ecrã inicial e funciona offline.

## Funcionalidades
- 10 destinos reais (Maputo, Inhaca, Ponta do Ouro, Tofo, Inhambane, Vilankulo, Bazaruto, Gorongosa, Ilha de Moçambique, Quirimbas)
- Alojamento, restaurantes, atividades e transportes com filtros e pesquisa
- Mapa real (OpenStreetMap) com marcadores por categoria e "Onde estou"
- Assistente que gera roteiros a partir de frases ("4 dias no Tofo com 15000 MT"), responde a perguntas e faz câmbio
- Gerador de roteiros com orçamento por categoria, guardar, partilhar, WhatsApp e imprimir/PDF
- Favoritos, perfil, exportar/importar dados
- Empresas publicam o negócio grátis com botão de WhatsApp; painel com visualizações e contactos (editar/apagar)
- Pedido de transporte enviado pelo WhatsApp
- Câmbio USD/EUR/ZAR com taxa atualizada automaticamente (open.er-api.com)

## Publicar grátis
- **Netlify Drop**: arrasta a pasta para https://app.netlify.com/drop
- **GitHub Pages**: carrega os ficheiros num repositório e ativa Pages
Precisa de HTTPS para instalar como app e funcionar offline.

## Limites
Os dados (perfis, negócios, roteiros) ficam guardados no dispositivo de cada pessoa. Para negócios aparecerem a todos os utilizadores é preciso um backend (ex.: Supabase) — próximo passo.
Para editar destinos e lugares base: `data.js`.
