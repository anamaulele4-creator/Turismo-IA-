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

## Novidades (versão 3)

- **Design moderno**: tipografia Plus Jakarta Sans, cartões com sombras suaves, hero de praia, navegação inferior flutuante no telemóvel, ícones SVG próprios (sem emojis).
- **Guias turísticos**: catálogo com 22 serviços (city tours, património, cultura, gastronomia, turismo comunitário, safari, aves, trilhos, mergulho, tubarão-baleia, golfinhos, baleias, dhow, ilhas, pesca, desportos aquáticos, cavalo, transfers, tradução, fotografia, planeamento, expedições), filtráveis por tipo e destino. Os guias marcam os serviços que oferecem no perfil.
- **Chat de negociação em tempo real** entre telemóveis (via ntfy.sh): mensagens, propostas de preço, contraproposta, aceitar/recusar, acordo fechado e confirmação por WhatsApp. Mural de pedidos onde os viajantes publicam o que procuram e os guias respondem com propostas.
- **Login seguro**: palavra-passe cifrada com PBKDF2-SHA256 (310 000 iterações, sal aleatório), comparação em tempo constante, bloqueio após 5 tentativas, sessão que expira por inatividade, medidor de força, alterar palavra-passe e eliminar conta.
- **Idiomas**: deteta o idioma do telemóvel (PT, EN, FR, ES), seletor manual, assistente que muda para o idioma em que o utilizador escreve e botão Traduzir nas mensagens recebidas.

Limites: as contas ficam no dispositivo (não há servidor de contas); o canal de mensagens ntfy.sh é público e não deve ser usado para dados sensíveis ou pagamentos. Para produção, migrar contas e chat para um backend (por exemplo Supabase) com autenticação no servidor.
