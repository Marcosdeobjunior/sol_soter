# Manual RPG - Sol de Soter

## Visao Geral
O sistema RPG transforma suas acoes no app em progresso de personagem.
Cada acao gera XP, evolui atributos e desbloqueia recursos.

Voce evolui em 3 frentes:
- Nivel geral da conta
- Atributos (Forca, Intelecto, Sabedoria, Produtividade)
- Economia RPG (moedas, itens, talentos e prestigio)

## O que da XP
As principais fontes de XP sao:
- Planejamento: concluir tarefas (facil, media, dificil)
- Diario: criar entradas (texto e tags aumentam ganho)
- Sonhos e metas: eventos do sistema que chamam ganho customizado
- Livraria: salvar progresso de leitura (XP por paginas novas)
- Mangas: salvar progresso de leitura (XP por paginas novas)
- Cinema: salvar progresso (filme por minutos; serie/anime por episodios)
- Streak de entretenimento: recompensa diaria de Sabedoria

Regra pratica:
- Quanto mais constancia e tarefas completas, mais nivel e moedas voce ganha.

## Para onde o XP vai
O XP pode afetar:
- Nivel geral (sempre)
- Um atributo especifico (quando a categoria mapeia para um stat)

Mapeamento de categorias:
- Forca: `strength`, `forca`, `health`, `academia`
- Intelecto: `intelligence`, `intelecto`, `study`, `livraria`, `cinema`, `manga`, `mangas`, `entretenimento`
- Sabedoria: `wisdom`, `sabedoria`, `financeiro`, `meta`, `sonho`
- Produtividade: `productivity`, `produtividade`, `work`, `personal`

## Regras de XP do entretenimento
Ao salvar progresso:
- Livraria/Mangas: `XP base = floor(paginasNovas / 5) + 2` (min 2, max 40)
- Cinema (filme): `XP base = floor(minutosNovos / 12) + 2` (min 2, max 40)
- Cinema (serie/anime): `XP base = episodiosNovos * 4` (min 4, max 40)

Streak de entretenimento (uma vez por dia):
- 1 a 4 dias: 4 XP base em Sabedoria
- 5 a 9 dias: 10 XP base em Sabedoria
- 10 a 19 dias: 16 XP base em Sabedoria
- 20+ dias: 24 XP base em Sabedoria

## Classes RPG
Classes mudam o foco da evolucao com multiplicadores de XP.

Classes disponiveis:
- Aventureiro: equilibrado
- Guerreiro: foco em Forca
- Arcanista: foco em Intelecto e Sabedoria
- Estrategista: foco em Produtividade e Sabedoria

Importante:
- Trocar classe nao apaga progresso.
- Classe altera o ritmo de crescimento dos atributos.

## Talentos
Talentos sao upgrades permanentes.

Como funciona:
- Voce ganha pontos ao subir de nivel.
- Gasta pontos para desbloquear talentos.
- Talentos aumentam multiplicadores de XP global ou por atributo.

## Loja, moedas e inventario
Moedas sao ganhas junto com a progressao.

Na loja voce pode:
- Comprar equipamentos
- Equipar itens comprados

Inventario:
- Mostra somente itens que voce possui.
- Item equipado entra no calculo de bonus de XP.

## Ranks
Seu rank sobe conforme nivel.
Faixas padrao:
- Bronze
- Prata
- Ouro
- Diamante
- Platina
- Profissional

Os limites de cada faixa podem ser ajustados na configuracao RPG.

## Streak
Streak mede dias de atividade.

Regras visuais atuais:
- Menor que 5: sem efeito
- De 5 ate 19: fogo simples
- 20 ou mais: chama forte

## Prestigio
Prestigio e uma camada avancada.

Resumo:
- Desbloqueia em nivel alto.
- Reinicia parte da progressao.
- Concede bonus permanente para futuras evolucoes.

## Como usar a tela de Configuracao RPG
Campos principais:
- XP base para proximo nivel: define o ponto de partida da curva
- Multiplicador por nivel: aumenta dificuldade da progressao geral
- Fator XP por nivel de stat: custo para subir atributos
- XP por dificuldade: recompensa de tarefa facil/media/dificil
- Limites de ranking: define ate qual nivel cada rank vai

Botoes da tela:
- Salvar configuracoes: aplica novas regras
- Recalcular XP do nivel atual: atualiza alvo com base na regra nova
- Restaurar padrao: volta para configuracao original

## Fluxo recomendado para usuario
1. Escolha uma classe conforme seu foco atual.
2. Mantenha rotina diaria para sustentar streak.
3. Conclua tarefas de maior impacto para subir mais rapido.
4. Use moedas em itens que reforcem seu foco.
5. Desbloqueie talentos que combinem com sua classe.
6. Ajuste configuracoes apenas quando quiser mudar o ritmo da jornada.

## Arquivos principais do sistema
- `js/rpg.js`
- `js/perfil-rpg.js`
- `js/planejamento.js`
- `js/diario.js`
- `js/sonhos.js`
- `rpg-config.html`
- `perfil-rpg.html`
